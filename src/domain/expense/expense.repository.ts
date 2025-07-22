import type { Expense, NewExpense } from "../../db/schema";

export interface ExpenseRepository {
	getSplitBetween(expenseId: number): Promise<{ userName: string }[]>;
	getAll(chatId: string): Promise<Expense[]>;
	save(
		expense: NewExpense,
		splitBetween: string[],
		groupId: number,
	): Promise<{ id: number; createdAt: Date }>;
}
