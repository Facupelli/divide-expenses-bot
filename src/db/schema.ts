import { primaryKey } from "drizzle-orm/sqlite-core";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = sqliteTable("users", {
  name: text("name").primaryKey().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payer: text("payer").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
});

export const expenseParticipants = sqliteTable(
  "expense_participants",
  {
    expenseId: integer("expense_id")
      .references(() => expenses.id, { onDelete: "cascade" })
      .notNull(),
    userName: text("user_name")
      .references(() => users.name, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.userName] })]
);

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
