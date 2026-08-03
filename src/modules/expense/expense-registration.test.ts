import assert from "node:assert/strict";
import test from "node:test";
import type { Expense, NewExpense } from "../../db/schema";
import type { ExpenseRepository } from "./expense.repository";
import { ExpenseService } from "./expense.service";

const groupUsers = [
	"Pelli",
	"Waldo",
	"Cruz",
	"Abdul",
	"Shefri",
	"Diego",
	"Acosta",
];

test("resolves an explicit exclusion against the whole group and includes the payer", async () => {
	let savedParticipants: string[] = [];
	const repository: ExpenseRepository = {
		async getAll() {
			return [];
		},
		async getSplitBetween() {
			return [];
		},
		async saveMultiple(items) {
			savedParticipants = items[0].splitBetween;
			const saved: Expense & { splitBetween: string[] } = {
				...(items[0].expense as NewExpense),
				id: 1,
				operationKey: "expense:test",
				operationIndex: 0,
				createdAt: new Date(),
				splitBetween: items[0].splitBetween,
			};
			return [saved];
		},
	};
	const service = new ExpenseService(repository, {
		async getActive() {
			return 1;
		},
		async getUsers() {
			return groupUsers;
		},
	});

	const [saved] = await service.saveMultiple(
		[
			{
				payer: "cruz",
				amount: "24500",
				description: "fernet",
				// Reproduces the incorrect list previously returned by the model.
				splitBetween: ["Acosta", "Waldo", "abdul", "diego", "pelli", "shefri"],
				excludedParticipants: ["abdul"],
			},
		],
		"chat-1",
		"expense:test",
	);

	assert.deepEqual(savedParticipants, [
		"Pelli",
		"Waldo",
		"Cruz",
		"Shefri",
		"Diego",
		"Acosta",
	]);
	assert.equal(saved.payer, "Cruz");
	assert.deepEqual(saved.splitBetween, savedParticipants);
	assert.ok(savedParticipants.includes("Cruz"));
	assert.ok(!savedParticipants.includes("Abdul"));
});
