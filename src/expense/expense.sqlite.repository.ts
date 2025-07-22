import { db } from "../db";
import {
  Expense,
  expenseParticipants,
  expenses,
  insertExpenseParticipantSchema,
  NewExpense,
} from "../db/schema";
import { ExpenseRepository } from "./expense.repository";

export class SqliteExpenseRepository implements ExpenseRepository {
  async getAll(): Promise<Expense[]> {
    try {
      return await db.select().from(expenses);
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async save(expense: NewExpense, splitBetween: string[]): Promise<void> {
    try {
      await db.transaction(
        (tx) => {
          const { insertedId } = tx
            .insert(expenses)
            .values(expense)
            .returning({ insertedId: expenses.id })
            .get();

          const participantRecords = splitBetween.map((userName) =>
            insertExpenseParticipantSchema.parse({
              expenseId: insertedId,
              userName,
            })
          );

          tx.insert(expenseParticipants).values(participantRecords).run();
        },
        { behavior: "deferred" }
      );
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }
}
