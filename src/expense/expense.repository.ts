import { Expense, NewExpense } from "../db/schema";

export interface ExpenseRepository {
  getAll(): Promise<Expense[]>;
  save(expense: NewExpense, splitBetween: string[]): Promise<void>;
}
