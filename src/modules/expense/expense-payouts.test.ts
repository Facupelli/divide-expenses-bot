import assert from "node:assert/strict";
import test from "node:test";
import type { Expense } from "../../db/schema";
import type { ExpenseRepository } from "./expense.repository";
import { ExpenseService } from "./expense.service";
import { ExpensePresenter } from "./expense-presenter";

const users = ["Pelli", "Waldo", "Ana", "Beto", "Carla", "Diego"];

function createExpense(id: number, payer: string, amount: number): Expense {
	return {
		id,
		groupId: 1,
		payer,
		amount,
		description: `Expense ${id}`,
		operationKey: null,
		operationIndex: null,
		createdAt: new Date(),
	};
}

function createService(
	expenses: Expense[],
	participantsByExpense: Map<number, string[]>,
): ExpenseService {
	const expenseRepository: ExpenseRepository = {
		getAll: async () =>
			expenses.map((expense) => ({
				...expense,
				splitBetween: participantsByExpense.get(expense.id) ?? [],
			})),
		getSplitBetween: async (expenseId: number) =>
			(participantsByExpense.get(expenseId) ?? []).map((userName) => ({
				userName,
			})),
		saveMultiple: async () => [],
	};
	const groupService = {
		checkUserIsInGroup: async () => true,
		getActive: async () => 1,
		getUsers: async () => users,
	};

	return new ExpenseService(expenseRepository, groupService);
}

test("shows accumulated shares when expenses have different participant sets", async () => {
	const service = createService(
		[createExpense(1, "Pelli", 600_000), createExpense(2, "Waldo", 400_000)],
		new Map([
			[1, users],
			[2, ["Waldo", "Ana", "Beto", "Carla"]],
		]),
	);

	const result = await service.getPayouts("chat-id");
	assert.equal(result.eachShare, null);
	assert.deepEqual(result.accumulatedShares, [
		{ user: "Pelli", amount: BigInt(100000) },
		{ user: "Waldo", amount: BigInt(200000) },
		{ user: "Ana", amount: BigInt(200000) },
		{ user: "Beto", amount: BigInt(200000) },
		{ user: "Carla", amount: BigInt(200000) },
		{ user: "Diego", amount: BigInt(100000) },
	]);

	const response = await new ExpensePresenter(service).getPayouts("chat-id");
	assert.match(response.message, /Total de gastos:.*10\.000/);
	assert.match(response.message, /Parte acumulada:/);
	assert.match(response.message, /- Waldo:.*2\.000/);
	assert.doesNotMatch(response.message, /Por persona:/);
});

test("shows a per-person share based on the common participant set", async () => {
	const commonParticipants = ["Pelli", "Waldo", "Ana", "Beto"];
	const service = createService(
		[createExpense(1, "Pelli", 600_000), createExpense(2, "Waldo", 400_000)],
		new Map([
			[1, commonParticipants],
			[2, [...commonParticipants].reverse()],
		]),
	);

	const result = await service.getPayouts("chat-id");
	assert.equal(result.eachShare, BigInt(250000));

	const response = await new ExpensePresenter(service).getPayouts("chat-id");
	assert.match(response.message, /Por persona:.*2\.500/);
	assert.doesNotMatch(response.message, /Parte acumulada:/);
});

test("settles a repeating split fairly to the cent", async () => {
	const service = createService(
		[createExpense(1, "Pelli", 10_000)],
		new Map([[1, ["Pelli", "Waldo", "Ana"]]]),
	);

	const result = await service.getPayouts("chat-id");
	assert.deepEqual(result.accumulatedShares.slice(0, 3), [
		{ user: "Pelli", amount: BigInt(3334) },
		{ user: "Waldo", amount: BigInt(3333) },
		{ user: "Ana", amount: BigInt(3333) },
	]);
	assert.deepEqual(
		result.transactions.map(({ debtor, payerAmount, creditor }) => ({
			debtor: debtor.user,
			amount: payerAmount,
			creditor: creditor.user,
		})),
		[
			{ debtor: "Waldo", amount: BigInt(3333), creditor: "Pelli" },
			{ debtor: "Ana", amount: BigInt(3333), creditor: "Pelli" },
		],
	);

	const response = await new ExpensePresenter(service).getPayouts("chat-id");
	assert.match(response.message, /Waldo debe \$33,33 a Pelli/);
	assert.match(response.message, /Ana debe \$33,33 a Pelli/);
});
