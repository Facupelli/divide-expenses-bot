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
		getAll: async () => expenses,
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
		[createExpense(1, "Pelli", 6000), createExpense(2, "Waldo", 4000)],
		new Map([
			[1, users],
			[2, ["Waldo", "Ana", "Beto", "Carla"]],
		]),
	);

	const result = await service.getPayouts("chat-id");
	assert.equal(result.eachShare, null);
	assert.deepEqual(result.accumulatedShares, [
		{ user: "Pelli", amount: 1000 },
		{ user: "Waldo", amount: 2000 },
		{ user: "Ana", amount: 2000 },
		{ user: "Beto", amount: 2000 },
		{ user: "Carla", amount: 2000 },
		{ user: "Diego", amount: 1000 },
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
		[createExpense(1, "Pelli", 6000), createExpense(2, "Waldo", 4000)],
		new Map([
			[1, commonParticipants],
			[2, [...commonParticipants].reverse()],
		]),
	);

	const result = await service.getPayouts("chat-id");
	assert.equal(result.eachShare, 2500);

	const response = await new ExpensePresenter(service).getPayouts("chat-id");
	assert.match(response.message, /Por persona:.*2\.500/);
	assert.doesNotMatch(response.message, /Parte acumulada:/);
});
