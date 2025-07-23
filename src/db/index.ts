import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const isDev = process.env.NODE_ENV === "development";
const dbPath = isDev ? "database.db" : process.env.SQLITE_PATH;

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export type DB = ReturnType<typeof drizzle<typeof schema>>;

process.on("SIGINT", () => {
	sqlite.close();
	process.exit(0);
});
