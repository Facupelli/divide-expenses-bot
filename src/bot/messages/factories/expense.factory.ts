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

type ExpenseWithParticipants = Expense & { splitBetween: string[] };

export function createListExpensesMessage(
	expenses: ExpenseWithParticipants[],
): string {
	return [
		"📒 Lista de gastos del grupo",
		"",
		expenses
			.map((expense, index) => formatExpense(expense, index + 1))
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

function createSingleExpenseMessage(expense: ExpenseWithParticipants): string {
	return ["✅ Gasto registrado", "", formatExpense(expense)].join("\n");
}

function createMultipleExpensesMessage(
	expenses: ExpenseWithParticipants[],
): string {
	return [
		`✅ ${expenses.length} gastos registrados`,
		"",
		expenses
			.map((expense, index) => formatExpense(expense, index + 1))
			.join("\n\n"),
	].join("\n");
}

function formatExpense(
	expense: ExpenseWithParticipants,
	number?: number,
): string {
	const share = expense.amount / expense.splitBetween.length;
	const hasExactShare = Number.isInteger(share);
	const title = `${number == null ? "📝" : `${number}.`} ${expense.description}: ${formatAmount(expense.amount)}`;
	const shareLines = hasExactShare
		? [`💰 Parte individual: ${formatShare(share)}`]
		: [
				`💰 Parte individual aproximada: ${formatShare(share)}`,
				"La diferencia se compensará al ajustar las cuentas.",
			];

	return [
		title,
		`👤 Pagó: ${expense.payer}`,
		`👥 Se divide entre: ${formatParticipantList(expense.splitBetween)}`,
		...shareLines,
		`🕒 ${formatTimestamp(expense.createdAt)}`,
	].join("\n");
}

function formatParticipantList(participants: string[]): string {
	if (participants.length < 2) {
		return participants.join("");
	}

	return `${participants.slice(0, -1).join(", ")} y ${participants[participants.length - 1]}`;
}

function formatShare(value: number): string {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
		maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
	}).format(value);
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
