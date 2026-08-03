# Database module

Owns SQLite access, the Drizzle schema, and migrations.

## Data model

```text
groups
  -> users
  -> expenses
       -> expense_participants
```

- A group is scoped to a Telegram chat.
- Users are unique by `(name, groupId)`.
- Expenses belong to groups.
- Expense participants reference users in the same group.

## Rules

- Update `schema.ts`, then generate a migration with Drizzle Kit.
- Never manually edit generated migration metadata.
- Enable and preserve foreign-key enforcement.
- Use transactions for operations spanning multiple rows or tables.
- Keep database files out of version control.
- Production uses `SQLITE_PATH`; development currently uses `database.db`.
