import assert from "node:assert/strict";
import test from "node:test";
import { createErrorExpenseMessage } from "../../bot/messages/factories/expense.factory";
import type { Expense, NewExpense } from "../../db/schema";
import {
	AmbiguousParticipantsError,
	EmptyExpenseSplitError,
	InvalidParticipantsError,
	InvalidPayersError,
} from "./expense.errors";
import type { ExpenseRepository } from "./expense.repository";
import { type ExpenseInput, ExpenseService } from "./expense.service";

const groupUsers = ["Pelli", "Waldo", "Cruz", "Abdul", "Shefri"];

function setup(groupUsersForChat: string[] = groupUsers) {
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
				return groupUsersForChat;
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

test("include canonicalizes names without adding the payer", async () => {
	const { service } = setup();
	const [saved] = await service.saveMultiple(
		[expense({ mode: "include", names: [" pelli ", "wALdo"] })],
		"chat-1",
		"expense:test",
	);
	assert.deepEqual(saved.splitBetween, ["Pelli", "Waldo"]);
});

test("expense resolution matches accents and whitespace while preserving registered names", async () => {
	const { service } = setup(["Pelli", "José"]);
	const [saved] = await service.saveMultiple(
		[expense({ mode: "include", names: [" jose "] }, " pELLI ")],
		"chat-1",
		"expense:test",
	);
	assert.equal(saved.payer, "Pelli");
	assert.deepEqual(saved.splitBetween, ["José"]);
});

test("exclude resolves against all members without restoring an excluded payer", async () => {
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
		"Pelli",
		"Waldo",
		"Abdul",
		"Shefri",
	]);
});

test("empty resolved splits reject the whole batch without writing", async () => {
	const { service, writes } = setup();
	for (const split of [
		{ mode: "include" as const, names: [] },
		{ mode: "exclude" as const, names: groupUsers },
	]) {
		await assert.rejects(
			service.saveMultiple(
				[expense({ mode: "all", names: [] }), expense(split)],
				"chat-1",
				"expense:batch",
			),
			(error: unknown) =>
				error instanceof EmptyExpenseSplitError &&
				/menos un participante/.test(createErrorExpenseMessage(error)),
		);
	}
	assert.equal(writes.length, 0);
});

test("ambiguous historical names reject registration and report conflicts", async () => {
	const { service, writes } = setup([
		"Pelli",
		"pelli",
		" PELLI ",
		"José",
		" Jose ",
	]);
	await assert.rejects(
		service.saveMultiple(
			[expense({ mode: "all", names: [] }, "Pelli")],
			"chat-1",
			"expense:test",
		),
		(error: unknown) =>
			error instanceof AmbiguousParticipantsError &&
			/Pelli \/ pelli \/ {2}PELLI /.test(createErrorExpenseMessage(error)) &&
			/José \/ {2}Jose /.test(createErrorExpenseMessage(error)),
	);
	assert.equal(writes.length, 0);
	assert.deepEqual(await service.getAll("chat-1"), []);
	assert.deepEqual((await service.getPayouts("chat-1")).transactions, []);
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
		[groupUsers, ["Pelli"]],
	);
	await service.saveMultiple(batch, "chat-1", "expense:batch");
	assert.equal(writes[0].hash, writes[1].hash);
	assert.equal(writes[1].key, "expense:batch");
});
