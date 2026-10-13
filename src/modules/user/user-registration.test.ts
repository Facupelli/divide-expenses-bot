import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../db/schema";
import { GroupService } from "../group/group.service";
import { SqliteGroupRepository } from "../group/group.sqlite.repository";
import { UserService } from "./user.service";
import { SqliteUserRepository } from "./user.sqlite.repository";
import { UserPresenter } from "./user-presenter";

function setup() {
	const sqlite = new Database(":memory:");
	sqlite.pragma("foreign_keys = ON");
	sqlite.exec(`
		CREATE TABLE groups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			chat_id TEXT NOT NULL,
			isActive INTEGER NOT NULL,
			name TEXT,
			created_at INTEGER NOT NULL
		);
		CREATE TABLE users (
			name TEXT NOT NULL,
			group_id INTEGER NOT NULL REFERENCES groups(id),
			created_at INTEGER NOT NULL,
			PRIMARY KEY (name, group_id)
		);
	`);
	const db = drizzle(sqlite, { schema });
	const groupService = new GroupService(new SqliteGroupRepository(db));
	const service = new UserService(new SqliteUserRepository(db), groupService);
	return {
		sqlite,
		service,
		presenter: new UserPresenter(service, groupService),
	};
}

function rowCount(
	sqlite: Database.Database,
	table: "groups" | "users",
): number {
	return (
		sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }
	).n;
}

for (const [description, names, expected] of [
	["case-insensitive duplicates", ["Pelli", "pelli"], /Pelli \/ pelli/],
	[
		"three colliding names",
		["Pelli", "pelli", " PELLI "],
		/Pelli \/ pelli \/ {2}PELLI /,
	],
	["accent-insensitive duplicates", ["José", "Jose"], /José \/ Jose/],
	["whitespace variants", ["Waldo", " Waldo "], /Waldo \/ {2}Waldo /],
	["multiple conflicts", ["Pelli", "pelli", "José", "Jose"], /José \/ Jose/],
	["empty names", ["Pelli", "   "], /nombres.*vacíos/],
	["empty groups", [], /al menos una persona/],
] as const) {
	test(`rejects ${description} without creating a group or participants`, async () => {
		const { sqlite, presenter } = setup();
		try {
			const result = await presenter.addUsers([...names], "chat-1");
			assert.equal(result.success, false);
			assert.match(result.message, expected);
			if (description === "multiple conflicts") {
				assert.match(result.message, /Pelli \/ pelli/);
			}
			assert.equal(rowCount(sqlite, "groups"), 0);
			assert.equal(rowCount(sqlite, "users"), 0);
		} finally {
			sqlite.close();
		}
	});
}

test("stores distinct names trimmed and confirms their stored spelling", async () => {
	const { sqlite, presenter, service } = setup();
	try {
		const result = await presenter.addUsers(
			[" Pelli ", " José ", "Waldo"],
			"chat-1",
		);
		assert.equal(result.success, true);
		assert.match(result.message, /- Pelli\n- José\n- Waldo/);
		assert.deepEqual(
			(
				sqlite.prepare("SELECT name FROM users ORDER BY rowid").all() as {
					name: string;
				}[]
			).map((row) => row.name),
			["Pelli", "José", "Waldo"],
		);
		assert.equal(rowCount(sqlite, "groups"), 1);
		await assert.rejects(service.saveMultiple(["Ana"], "chat-1"));
	} finally {
		sqlite.close();
	}
});
