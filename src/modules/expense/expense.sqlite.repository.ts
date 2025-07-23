import { and, eq, exists } from "drizzle-orm";
import type { DB } from "../../db";
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
	constructor(private readonly db: DB) {}

	async getAll(chatId: string): Promise<Expense[]> {
		try {
			const groupExpenses = await this.db
				.select()
				.from(expenses)
				.where(
					exists(
						this.db
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
			const splitBetween = await this.db
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
	): Promise<Expense> {
		try {
			return await this.db.transaction(
				(tx) => {
					const newExpense = tx
						.insert(expenses)
						.values(expense)
						.returning()
						.get();

					const participantRecords = splitBetween.map((userName) =>
						insertExpenseParticipantSchema.parse({
							expenseId: newExpense.id,
							userName,
							groupId,
						}),
					);

					tx.insert(expenseParticipants).values(participantRecords).run();

					return newExpense;
				},
				{ behavior: "deferred" },
			);
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}
}
