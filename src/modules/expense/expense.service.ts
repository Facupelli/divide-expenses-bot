import { createHash } from "node:crypto";
import { type Expense, insertExpenseSchema } from "../../db/schema";
import type { GroupService } from "../group/group.service";
import {
	CreateExpenseError,
	InvalidPayersError,
	NoActiveGroupError,
} from "./expense.errors";
import type { ExpenseRepository } from "./expense.repository";
import type { PayoutsResponse, PayoutTransaction } from "./expense.types";
import { parseAmountToCents } from "./money";

type Fraction = { numerator: bigint; denominator: bigint };

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
	let a = left;
	let b = right;
	while (b !== BigInt(0)) {
		[a, b] = [b, a % b];
	}
	return a;
}

function addFraction(left: Fraction, right: Fraction): Fraction {
	const numerator =
		left.numerator * right.denominator + right.numerator * left.denominator;
	const denominator = left.denominator * right.denominator;
	const divisor = greatestCommonDivisor(numerator, denominator);
	return {
		numerator: numerator / divisor,
		denominator: denominator / divisor,
	};
}

function allocateRoundedShares(
	users: string[],
	shares: Record<string, Fraction>,
	total: bigint,
): Record<string, bigint> {
	const allocated = Object.fromEntries(
		users.map((user) => [
			user,
			shares[user].numerator / shares[user].denominator,
		]),
	) as Record<string, bigint>;
	let residual =
		total -
		Object.values(allocated).reduce((sum, value) => sum + value, BigInt(0));
	const byLargestRemainder = users
		.map((user, order) => ({ user, order, ...shares[user] }))
		.sort((left, right) => {
			const comparison =
				(left.numerator % left.denominator) * right.denominator -
				(right.numerator % right.denominator) * left.denominator;
			return comparison === BigInt(0)
				? left.order - right.order
				: comparison > BigInt(0)
					? -1
					: 1;
		});

	for (const { user } of byLargestRemainder) {
		if (residual === BigInt(0)) break;
		allocated[user] += BigInt(1);
		residual -= BigInt(1);
	}

	return allocated;
}

type ExpenseGroupService = Pick<
	GroupService,
	"checkUserIsInGroup" | "getActive" | "getUsers"
>;

export class ExpenseService {
	constructor(
		private expenseRepository: ExpenseRepository,
		private groupService: ExpenseGroupService,
	) {}

	async getAll(chatId: string) {
		return await this.expenseRepository.getAll(chatId);
	}

	async saveMultiple(
		expenses: Array<{
			payer: string;
			amount: string;
			description: string;
			splitBetween: string[];
		}>,
		chatId: string,
		idempotencyKey: string,
	): Promise<Array<Expense & { splitBetween: string[] }>> {
		const groupId = await this.groupService.getActive(chatId);

		if (groupId == null) {
			throw new NoActiveGroupError();
		}

		// Validate all payers are in the group
		const invalidPayers = [];
		for (const expense of expenses) {
			const isUserValid = await this.groupService.checkUserIsInGroup(
				expense.payer,
				chatId,
			);
			if (!isUserValid) {
				invalidPayers.push(expense.payer);
			}
		}

		if (invalidPayers.length > 0) {
			throw new InvalidPayersError(invalidPayers);
		}

		try {
			const expensesInCents = expenses.map((expense) => ({
				...expense,
				amount: parseAmountToCents(expense.amount),
			}));
			const validated = expensesInCents.map((expense) => ({
				expense: insertExpenseSchema.parse({
					payer: expense.payer,
					amount: expense.amount,
					description: expense.description,
					groupId,
				}),
				splitBetween: expense.splitBetween,
			}));
			const canonicalPayload = expensesInCents.map((expense) => ({
				payer: expense.payer,
				amount: expense.amount,
				description: expense.description,
				splitBetween: expense.splitBetween,
			}));
			const payloadHash = createHash("sha256")
				.update(JSON.stringify(canonicalPayload))
				.digest("hex");

			return await this.expenseRepository.saveMultiple(
				validated,
				groupId,
				idempotencyKey,
				payloadHash,
			);
		} catch (_) {
			throw new CreateExpenseError();
		}
	}

	async getPayouts(chatId: string): Promise<PayoutsResponse> {
		const groupId = await this.groupService.getActive(chatId);

		if (groupId == null) {
			throw new NoActiveGroupError();
		}

		const expensesList = await this.getAll(chatId);
		const usersList = await this.groupService.getUsers(chatId);

		// STEP 1 - get users balances
		const paid: Record<string, bigint> = {};
		const exactShares: Record<string, Fraction> = {};
		usersList.forEach((user) => {
			paid[user] = BigInt(0);
			exactShares[user] = { numerator: BigInt(0), denominator: BigInt(1) };
		});

		const participantSets: string[][] = [];
		for (const expense of expensesList) {
			const splitBetween = await this.getSplitBetween(expense.id);
			const expenseUsers = splitBetween.map((user) => user.userName);
			participantSets.push([...expenseUsers].sort());

			const amount = BigInt(expense.amount);
			const share = {
				numerator: amount,
				denominator: BigInt(expenseUsers.length),
			};
			paid[expense.payer] += amount;

			for (const user of expenseUsers) {
				exactShares[user] = addFraction(exactShares[user], share);
			}
		}

		const total = expensesList.reduce(
			(sum, expense) => sum + BigInt(expense.amount),
			BigInt(0),
		);
		const accumulatedShares = allocateRoundedShares(
			usersList,
			exactShares,
			total,
		);
		const usersBalance = Object.fromEntries(
			usersList.map((user) => [user, paid[user] - accumulatedShares[user]]),
		) as Record<string, bigint>;

		// STEP 2 - match and settle
		const creditors = [];
		const debtors = [];

		for (const [user, balance] of Object.entries(usersBalance)) {
			if (balance > 0) {
				creditors.push({ user, balance });
			} else if (balance < 0) {
				debtors.push({ user, balance });
			}
		}

		const transactions: PayoutTransaction[] = [];
		while (creditors.length > 0 && debtors.length > 0) {
			const creditor = creditors[0];
			const debtor = debtors[0];

			const debt = -debtor.balance;
			const payerAmount = creditor.balance < debt ? creditor.balance : debt;

			transactions.push({ debtor, payerAmount, creditor });

			creditor.balance -= payerAmount;
			debtor.balance += payerAmount;

			if (creditor.balance === BigInt(0)) {
				creditors.shift();
			}

			if (debtor.balance === BigInt(0)) {
				debtors.shift();
			}
		}

		//
		const firstParticipantSet = participantSets[0];
		const hasIdenticalParticipantSets =
			firstParticipantSet != null &&
			participantSets.every(
				(participants) =>
					participants.length === firstParticipantSet.length &&
					participants.every(
						(participant, index) => participant === firstParticipantSet[index],
					),
			);
		const participantCount = BigInt(firstParticipantSet?.length ?? 1);
		const eachShare =
			hasIdenticalParticipantSets && total % participantCount === BigInt(0)
				? total / participantCount
				: null;

		return {
			transactions,
			total,
			eachShare,
			accumulatedShares: usersList.map((user) => ({
				user,
				amount: accumulatedShares[user],
			})),
		};
	}

	private async getSplitBetween(expenseId: number) {
		return await this.expenseRepository.getSplitBetween(expenseId);
	}
}
