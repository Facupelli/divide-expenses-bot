import type { Expense, NewExpense } from "../../db/schema";

export interface ExpenseRepository {
	getSplitBetween(expenseId: number): Promise<{ userName: string }[]>;
	getAll(chatId: string): Promise<Expense[]>;
	saveMultiple(
		expenses: Array<{ expense: NewExpense; splitBetween: string[] }>,
		groupId: number,
		idempotencyKey: string,
		payloadHash: string,
	): Promise<Array<Expense & { splitBetween: string[] }>>;
}
