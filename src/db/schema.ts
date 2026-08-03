import {
	foreignKey,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const groups = sqliteTable("groups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	chatId: text("chat_id").notNull(),
	isActive: integer({ mode: "boolean" }).notNull(),
	name: text("name"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const users = sqliteTable(
	"users",
	{
		name: text("name").notNull(),
		groupId: integer("group_id")
			.references(() => groups.id, {
				onDelete: "cascade",
			})
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [primaryKey({ columns: [t.name, t.groupId] })],
);

export const expenseOperations = sqliteTable("expense_operations", {
	idempotencyKey: text("idempotency_key").primaryKey(),
	payloadHash: text("payload_hash").notNull(),
	groupId: integer("group_id")
		.references(() => groups.id, { onDelete: "cascade" })
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const expenses = sqliteTable(
	"expenses",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		groupId: integer("group_id")
			.references(() => groups.id, { onDelete: "cascade" })
			.notNull(),
		payer: text("payer").notNull(),
		amount: integer("amount").notNull(),
		description: text("description").notNull(),
		operationKey: text("operation_key").references(
			() => expenseOperations.idempotencyKey,
			{ onDelete: "restrict" },
		),
		operationIndex: integer("operation_index"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("expenses_operation_item_unique").on(
			t.operationKey,
			t.operationIndex,
		),
	],
);

export const expenseParticipants = sqliteTable(
	"expense_participants",
	{
		expenseId: integer("expense_id")
			.references(() => expenses.id, { onDelete: "cascade" })
			.notNull(),
		userName: text("user_name").notNull(),
		groupId: integer("group_id").notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.expenseId, t.userName] }),
		foreignKey({
			columns: [t.userName, t.groupId],
			foreignColumns: [users.name, users.groupId],
			name: "ep_user_fk",
		}).onDelete("cascade"),
	],
);

export const insertGroupSchema = createInsertSchema(groups);
export const selectGroupSchema = createSelectSchema(groups);
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertExpenseSchema = createInsertSchema(expenses);
export const selectExpenseSchema = createSelectSchema(expenses);
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const insertExpenseParticipantSchema =
	createInsertSchema(expenseParticipants);

export const telegramUpdates = sqliteTable("telegram_updates", {
	updateId: integer("update_id").primaryKey(),
	chatId: text("chat_id").notNull(),
	payload: text("payload").notNull(),
	status: text("status", {
		enum: ["received", "processing", "completed"],
	})
		.notNull()
		.default("received"),
	lastError: text("last_error"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const outboundMessages = sqliteTable(
	"outbound_messages",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		updateId: integer("update_id")
			.references(() => telegramUpdates.updateId, { onDelete: "cascade" })
			.notNull(),
		sequence: integer("sequence").notNull(),
		chatId: text("chat_id").notNull(),
		text: text("text").notNull(),
		status: text("status", { enum: ["pending", "sent"] })
			.notNull()
			.default("pending"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		sentAt: integer("sent_at", { mode: "timestamp" }),
	},
	(t) => [
		uniqueIndex("outbound_messages_update_sequence_unique").on(
			t.updateId,
			t.sequence,
		),
	],
);
