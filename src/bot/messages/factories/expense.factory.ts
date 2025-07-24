import type { Expense } from "../../../db/schema";
import {
	CreateExpenseError,
	InvalidPayersError,
	NoActiveGroupError,
} from "../../../modules/expense/expense.errors";
import {
	formatAmount,
	formatTimestamp,
} from "../../../modules/expense/expense.helpers";

export function createListExpensesMessage(expenses: Expense[]): string {
	return [
		"📒 Lista de gastos del grupo",
		"",
		expenses
			.map((expense) => {
				const date = expense.createdAt.toISOString();
				return `- ${expense.payer} pagó 💰 ${formatAmount(expense.amount)} por ${expense.description}\n${formatTimestamp(date)}`;
			})
			.join("\n\n"),
	].join("\n");
}

export function createSuccessExpenseMessage(
	expenses: Array<Expense & { splitBetween: string[] }>,
): string {
	if (expenses.length === 1) {
		return createSingleExpenseMessage(expenses[0]);
	}

	return createMultipleExpensesMessage(expenses);
}

function createSingleExpenseMessage(expense: Expense): string {
	return [
		"✅ Gasto registrado",
		`👤 ${expense.payer} pagó 💰 ${formatAmount(expense.amount)}`,
		`📝 por: ${expense.description}`,
		`🕒 ${expense.createdAt.toISOString()}`,
	].join("\n");
}

function createMultipleExpensesMessage(expenses: Expense[]): string {
	const header = `✅ ${expenses.length} gastos registrados:\n`;
	const expenseLines = expenses.map(
		(expense, index) =>
			`${index + 1}. ${expense.payer} - 💰 ${formatAmount(expense.amount)} - ${expense.description}`,
	);

	return header + expenseLines.join("\n");
}

export function createErrorExpenseMessage(error: unknown): string {
	if (error instanceof NoActiveGroupError) {
		return "❌ No hay ningún grupo activo actualmente.";
	}

	if (error instanceof InvalidPayersError) {
		const list = error.payers.map((p) => `• ${p}`).join("\n");
		return `❌ Las siguientes persibas no pertenecen al grupo:\n${list}`;
	}

	if (error instanceof CreateExpenseError) {
		return "❌ No se pudo registrar el gasto. Inténtalo de nuevo.";
	}

	return "❌ Ocurrió un error inesperado.";
}
