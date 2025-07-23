import { type Expense, insertExpenseSchema } from "../../db/schema";
import type { GroupService } from "../group/group.service";
import {
	CreateExpenseError,
	InvalidPayersError,
	NoActiveGroupError,
} from "./expense.errors";
import type { SqliteExpenseRepository } from "./expense.sqlite.repository";
import type { PayoutsResponse, PayoutTransaction } from "./expense.types";

export class ExpenseService {
	constructor(
		private expenseRepository: SqliteExpenseRepository,
		private groupService: GroupService,
	) {}

	async getAll(chatId: string) {
		return await this.expenseRepository.getAll(chatId);
	}

	async saveMultiple(
		expenses: Array<{
			payer: string;
			amount: number;
			description: string;
			splitBetween: string[];
		}>,
		chatId: string,
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

		// Process all expenses
		const results: Array<Expense & { splitBetween: string[] }> = [];

		try {
			for (const expense of expenses) {
				const expenseData = {
					payer: expense.payer,
					amount: expense.amount,
					description: expense.description,
				};

				const validatedExpense = insertExpenseSchema.parse({
					...expenseData,
					groupId,
				});

				const newExpense = await this.expenseRepository.save(
					validatedExpense,
					expense.splitBetween,
					groupId,
				);

				results.push({
					...newExpense,
					splitBetween: expense.splitBetween,
				});
			}
		} catch (_) {
			throw new CreateExpenseError();
		}

		return results;
	}

	async getPayouts(chatId: string): Promise<PayoutsResponse> {
		const groupId = await this.groupService.getActive(chatId);

		if (groupId == null) {
			throw new NoActiveGroupError();
		}

		const expensesList = await this.getAll(chatId);
		const usersList = await this.groupService.getUsers(chatId);

		// STEP 1 - get users balances
		const usersBalance: Record<string, number> = {};

		usersList.forEach((user) => {
			usersBalance[user] = 0;
		});

		for (const expense of expensesList) {
			const splitBetween = await this.getSplitBetween(expense.id);

			const expenseUsers = splitBetween.map((user) => user.userName);
			const share = expense.amount / expenseUsers.length;

			usersBalance[expense.payer] += expense.amount;

			for (const user of expenseUsers) {
				usersBalance[user] -= share;
			}
		}

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

			const payerAmount = Math.min(creditor.balance, Math.abs(debtor.balance));

			transactions.push({ debtor, payerAmount, creditor });

			creditor.balance -= payerAmount;
			debtor.balance += payerAmount;

			if (creditor.balance === 0) {
				creditors.shift();
			}

			if (debtor.balance === 0) {
				debtors.shift();
			}
		}

		//
		const total = expensesList.reduce(
			(acc, expense) => acc + expense.amount,
			0,
		);
		const eachShare = total / usersList.length;

		return { transactions, total, eachShare };
	}

	private async getSplitBetween(expenseId: number) {
		return await this.expenseRepository.getSplitBetween(expenseId);
	}
}
