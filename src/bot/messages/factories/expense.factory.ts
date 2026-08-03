import type { Expense } from "../../../db/schema";
import {
	CreateExpenseError,
	InvalidParticipantsError,
	InvalidPayersError,
	NoActiveGroupError,
} from "../../../modules/expense/expense.errors";
import {
	formatAmount,
	formatTimestamp,
} from "../../../modules/expense/expense.helpers";
import { formatFractionalCents } from "../../../modules/expense/money";

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
	const amount = BigInt(expense.amount);
	const participantCount = BigInt(expense.splitBetween.length);
	const hasExactShare = amount % participantCount === BigInt(0);
	const title = `${number == null ? "📝" : `${number}.`} ${expense.description}: ${formatAmount(amount)}`;
	const shareLines = hasExactShare
		? [`💰 Parte individual: ${formatAmount(amount / participantCount)}`]
		: [
				`💰 Parte individual aproximada: ${formatFractionalCents(amount, participantCount)}`,
			];

	return [
		title,
		`💳 Pagó: ${expense.payer}`,
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

export function createErrorExpenseMessage(error: unknown): string {
	if (error instanceof NoActiveGroupError) {
		return "❌ No hay ningún grupo activo actualmente.";
	}

	if (error instanceof InvalidPayersError) {
		const list = error.payers.map((p) => `• ${p}`).join("\n");
		return `❌ Las siguientes personas no pertenecen al grupo:\n${list}`;
	}

	if (error instanceof InvalidParticipantsError) {
		const list = error.participants
			.map((participant) => `• ${participant}`)
			.join("\n");
		return `❌ No se reconocieron estos participantes:\n${list}`;
	}

	if (error instanceof CreateExpenseError) {
		return "❌ No se pudo registrar el gasto. Inténtalo de nuevo.";
	}

	return "❌ Ocurrió un error inesperado.";
}
