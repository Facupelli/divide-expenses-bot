import { and, eq, exists } from "drizzle-orm";
import { db } from "../../db";
import {
	type Expense,
	expenseParticipants,
	expenses,
	groups,
	insertExpenseParticipantSchema,
	type NewExpense,
} from "../../db/schema";
import type { ExpenseRepository } from "./expense.repository";

export class SqliteExpenseRepository implements ExpenseRepository {
	async getAll(chatId: string): Promise<Expense[]> {
		try {
			const groupExpenses = await db
				.select()
				.from(expenses)
				.where(
					exists(
						db
							.select()
							.from(groups)
							.where(
								and(
									eq(groups.id, expenses.groupId),
									eq(groups.chatId, chatId),
									eq(groups.isActive, true),
								),
							),
					),
				);

			return groupExpenses;
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async getSplitBetween(expenseId: number): Promise<{ userName: string }[]> {
		try {
			const splitBetween = await db
				.select({ userName: expenseParticipants.userName })
				.from(expenseParticipants)
				.where(eq(expenseParticipants.expenseId, expenseId));

			return splitBetween;
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async save(
		expense: NewExpense,
		splitBetween: string[],
		groupId: number,
	): Promise<{ id: number; createdAt: Date }> {
		try {
			return await db.transaction(
				(tx) => {
					const { insertedId, createdAt } = tx
						.insert(expenses)
						.values(expense)
						.returning({
							insertedId: expenses.id,
							createdAt: expenses.createdAt,
						})
						.get();

					const participantRecords = splitBetween.map((userName) =>
						insertExpenseParticipantSchema.parse({
							expenseId: insertedId,
							userName,
							groupId,
						}),
					);

					tx.insert(expenseParticipants).values(participantRecords).run();

					return { id: insertedId, createdAt };
				},
				{ behavior: "deferred" },
			);
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}
}
