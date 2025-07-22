import { insertExpenseSchema, NewExpense } from "../db/schema";
import { SqliteExpenseRepository } from "./expense.sqlite.repository";

export class ExpenseService {
  constructor(private expenseRepository: SqliteExpenseRepository) {}

  async getAll(chatId: string) {
    return await this.expenseRepository.getAll(chatId);
  }

  async save(
    newExpense: Omit<NewExpense, "groupId">,
    splitBetween: string[],
    groupId: number
  ) {
    const validatedExpense = insertExpenseSchema.parse({
      ...newExpense,
      groupId,
    });

    await this.expenseRepository.save(validatedExpense, splitBetween, groupId);
  }

  async getSplitBetween(expenseId: number) {
    return await this.expenseRepository.getSplitBetween(expenseId);
  }
}
