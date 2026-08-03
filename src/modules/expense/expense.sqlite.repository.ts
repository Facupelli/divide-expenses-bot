import { and, asc, eq, exists } from "drizzle-orm";
import type { DB } from "../../db";
import {
	type Expense,
	expenseOperations,
	expenseParticipants,
	expenses,
	groups,
	insertExpenseParticipantSchema,
	type NewExpense,
} from "../../db/schema";
import type { ExpenseRepository } from "./expense.repository";

export class IdempotencyConflictError extends Error {}

export class SqliteExpenseRepository implements ExpenseRepository {
	constructor(private readonly db: DB) {}

	async getAll(
		chatId: string,
	): Promise<Array<Expense & { splitBetween: string[] }>> {
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

			return await Promise.all(
				groupExpenses.map(async (expense) => ({
					...expense,
					splitBetween: (await this.getSplitBetween(expense.id)).map(
						({ userName }) => userName,
					),
				})),
			);
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async getSplitBetween(expenseId: number): Promise<{ userName: string }[]> {
		try {
			return await this.db
				.select({ userName: expenseParticipants.userName })
				.from(expenseParticipants)
				.where(eq(expenseParticipants.expenseId, expenseId));
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async saveMultiple(
		items: Array<{ expense: NewExpense; splitBetween: string[] }>,
		groupId: number,
		idempotencyKey: string,
		payloadHash: string,
	): Promise<Array<Expense & { splitBetween: string[] }>> {
		try {
			return this.db.transaction(
				(tx) => {
					const existingOperation = tx
						.select()
						.from(expenseOperations)
						.where(eq(expenseOperations.idempotencyKey, idempotencyKey))
						.get();

					if (existingOperation != null) {
						if (
							existingOperation.payloadHash !== payloadHash ||
							existingOperation.groupId !== groupId
						) {
							throw new IdempotencyConflictError(
								"The idempotency key was already used with different expense data",
							);
						}

						return this.getOperationExpenses(tx, idempotencyKey);
					}

					tx.insert(expenseOperations)
						.values({ idempotencyKey, payloadHash, groupId })
						.run();

					for (const [operationIndex, item] of items.entries()) {
						const newExpense = tx
							.insert(expenses)
							.values({
								...item.expense,
								operationKey: idempotencyKey,
								operationIndex,
							})
							.returning()
							.get();

						const participantRecords = item.splitBetween.map((userName) =>
							insertExpenseParticipantSchema.parse({
								expenseId: newExpense.id,
								userName,
								groupId,
							}),
						);

						tx.insert(expenseParticipants).values(participantRecords).run();
					}

					return this.getOperationExpenses(tx, idempotencyKey);
				},
				{ behavior: "immediate" },
			);
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	private getOperationExpenses(
		db: Parameters<Parameters<DB["transaction"]>[0]>[0],
		idempotencyKey: string,
	): Array<Expense & { splitBetween: string[] }> {
		const savedExpenses = db
			.select()
			.from(expenses)
			.where(eq(expenses.operationKey, idempotencyKey))
			.orderBy(asc(expenses.operationIndex))
			.all();

		return savedExpenses.map((expense) => ({
			...expense,
			splitBetween: db
				.select({ userName: expenseParticipants.userName })
				.from(expenseParticipants)
				.where(eq(expenseParticipants.expenseId, expense.id))
				.all()
				.map(({ userName }) => userName),
		}));
	}
}
