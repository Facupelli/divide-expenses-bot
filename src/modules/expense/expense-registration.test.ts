import assert from "node:assert/strict";
import test from "node:test";
import type { Expense, NewExpense } from "../../db/schema";
import { InvalidParticipantsError, InvalidPayersError } from "./expense.errors";
import type { ExpenseRepository } from "./expense.repository";
import { type ExpenseInput, ExpenseService } from "./expense.service";

const groupUsers = ["Pelli", "Waldo", "Cruz", "Abdul", "Shefri"];

function setup() {
	const writes: Array<{
		items: Array<{ expense: NewExpense; splitBetween: string[] }>;
		key: string;
		hash: string;
	}> = [];
	const repository: ExpenseRepository = {
		async getAll() {
			return [];
		},
		async getSplitBetween() {
			return [];
		},
		async saveMultiple(items, _groupId, key, hash) {
			writes.push({ items, key, hash });
			return items.map((item, index): Expense & { splitBetween: string[] } => ({
				...(item.expense as NewExpense),
				id: index + 1,
				operationKey: key,
				operationIndex: index,
				createdAt: new Date(),
				splitBetween: item.splitBetween,
			}));
		},
	};
	return {
		writes,
		service: new ExpenseService(repository, {
			async getActive() {
				return 1;
			},
			async getUsers() {
				return groupUsers;
			},
		}),
	};
}

function expense(split: ExpenseInput["split"], payer = "cruz"): ExpenseInput {
	return { payer, amount: "24500.25", description: "fernet", split };
}

test("all resolves the registered group with canonical names", async () => {
	const { service, writes } = setup();
	const [saved] = await service.saveMultiple(
		[expense({ mode: "all", names: [] })],
		"chat-1",
		"expense:test",
	);
	assert.deepEqual(saved.splitBetween, groupUsers);
	assert.equal(saved.payer, "Cruz");
	assert.equal(saved.amount, 2450025);
	assert.equal(writes[0].key, "expense:test");
});

test("include canonicalizes names and retains the existing payer inclusion rule", async () => {
	const { service } = setup();
	const [saved] = await service.saveMultiple(
		[expense({ mode: "include", names: ["pelli", "wALdo"] })],
		"chat-1",
		"expense:test",
	);
	assert.deepEqual(saved.splitBetween, ["Cruz", "Pelli", "Waldo"]);
});

test("exclude resolves against all members and still includes an excluded payer", async () => {
	const { service } = setup();
	const [saved] = await service.saveMultiple(
		[expense({ mode: "exclude", names: ["abdul"] })],
		"chat-1",
		"expense:test",
	);
	assert.deepEqual(saved.splitBetween, ["Pelli", "Waldo", "Cruz", "Shefri"]);
	const [payerExcluded] = await service.saveMultiple(
		[expense({ mode: "exclude", names: ["CRUZ"] })],
		"chat-1",
		"expense:other",
	);
	assert.deepEqual(payerExcluded.splitBetween, [
		"Cruz",
		"Pelli",
		"Waldo",
		"Abdul",
		"Shefri",
	]);
});

test("unknown participants and payers are rejected without writing", async () => {
	const { service, writes } = setup();
	await assert.rejects(
		service.saveMultiple(
			[expense({ mode: "exclude", names: ["unknown"] })],
			"chat-1",
			"expense:test",
		),
		(error: unknown) =>
			error instanceof InvalidParticipantsError &&
			error.participants[0] === "unknown",
	);
	await assert.rejects(
		service.saveMultiple(
			[expense({ mode: "include", names: ["Waldo", "unknown"] })],
			"chat-1",
			"expense:test",
		),
		InvalidParticipantsError,
	);
	await assert.rejects(
		service.saveMultiple(
			[expense({ mode: "all", names: [] }, "unknown")],
			"chat-1",
			"expense:test",
		),
		InvalidPayersError,
	);
	assert.equal(writes.length, 0);
});

test("multiple expenses remain a single atomic repository operation with stable payload hashing", async () => {
	const { service, writes } = setup();
	const batch = [
		expense({ mode: "all", names: [] }),
		expense({ mode: "include", names: ["Pelli"] }, "waldo"),
	];
	const saved = await service.saveMultiple(batch, "chat-1", "expense:batch");
	assert.equal(writes.length, 1);
	assert.equal(writes[0].items.length, 2);
	assert.deepEqual(
		saved.map((item) => item.splitBetween),
		[groupUsers, ["Waldo", "Pelli"]],
	);
	await service.saveMultiple(batch, "chat-1", "expense:batch");
	assert.equal(writes[0].hash, writes[1].hash);
	assert.equal(writes[1].key, "expense:batch");
});
