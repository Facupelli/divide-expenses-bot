import assert from "node:assert/strict";
import test from "node:test";
import {
	createListExpensesMessage,
	createSuccessExpenseMessage,
} from "../../bot/messages/factories/expense.factory";
import type { Expense } from "../../db/schema";
import { formatAmount } from "./expense.helpers";

type ExpenseWithParticipants = Expense & { splitBetween: string[] };

function expense(
	overrides: Partial<ExpenseWithParticipants> = {},
): ExpenseWithParticipants {
	return {
		id: 1,
		groupId: 1,
		payer: "Waldo",
		amount: 4_000,
		description: "Entradas",
		operationKey: null,
		operationIndex: null,
		createdAt: new Date(),
		splitBetween: ["Waldo", "Ana", "Beto", "Carla"],
		...overrides,
	};
}

test("single expense confirmation explains an exact split", () => {
	const message = createSuccessExpenseMessage([expense()]);

	assert.match(message, /^✅ Gasto registrado\n\n/);
	assert.ok(message.includes(`📝 Entradas: ${formatAmount(4_000)}`));
	assert.ok(message.includes("👤 Pagó: Waldo"));
	assert.ok(message.includes("👥 Se divide entre: Waldo, Ana, Beto y Carla"));
	assert.ok(message.includes(`💰 Parte individual: ${formatAmount(1_000)}`));
	assert.ok(!message.includes("aproximada"));
});

test("confirmation explains a repeating split without implying exactness", () => {
	const message = createSuccessExpenseMessage([
		expense({ amount: 100, splitBetween: ["Waldo", "Ana", "Beto"] }),
	]);

	assert.ok(message.includes("💰 Parte individual aproximada:"));
	assert.ok(message.includes("33,33"));
	assert.ok(
		message.includes("La diferencia se compensará al ajustar las cuentas."),
	);
});

test("participant lists use natural Spanish conjunctions", () => {
	const one = createSuccessExpenseMessage([
		expense({ splitBetween: ["Waldo"], amount: 100 }),
	]);
	const two = createSuccessExpenseMessage([
		expense({ splitBetween: ["Waldo", "Ana"], amount: 100 }),
	]);

	assert.ok(one.includes("Se divide entre: Waldo"));
	assert.ok(two.includes("Se divide entre: Waldo y Ana"));
});

test("multiple confirmations explain each expense split", () => {
	const message = createSuccessExpenseMessage([
		expense(),
		expense({
			id: 2,
			payer: "Ana",
			amount: 900,
			description: "Comida",
			splitBetween: ["Ana", "Beto", "Carla"],
		}),
	]);

	assert.match(message, /^✅ 2 gastos registrados\n\n/);
	assert.ok(message.includes(`1. Entradas: ${formatAmount(4_000)}`));
	assert.ok(message.includes(`2. Comida: ${formatAmount(900)}`));
	assert.equal(message.match(/👥 Se divide entre:/g)?.length, 2);
	assert.equal(message.match(/💰 Parte individual:/g)?.length, 2);
});

test("expense history includes participants and individual shares", () => {
	const message = createListExpensesMessage([expense()]);

	assert.match(message, /^📒 Lista de gastos del grupo\n\n/);
	assert.ok(message.includes(`1. Entradas: ${formatAmount(4_000)}`));
	assert.ok(message.includes("👤 Pagó: Waldo"));
	assert.ok(message.includes("👥 Se divide entre: Waldo, Ana, Beto y Carla"));
	assert.ok(message.includes(`💰 Parte individual: ${formatAmount(1_000)}`));
});
