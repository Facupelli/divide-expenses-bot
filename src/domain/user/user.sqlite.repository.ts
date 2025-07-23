import type { DB } from "../../db";
import { type User, users } from "../../db/schema";
import type { UserRepository } from "./user.repository";

export class SqliteUserRepository implements UserRepository {
	constructor(private readonly db: DB) {}

	async saveMultiple(
		userNames: { name: string; groupId: number }[],
	): Promise<void> {
		try {
			await this.db.insert(users).values(userNames);
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async getAll(): Promise<User[]> {
		try {
			const result = await this.db.select().from(users);
			return result;
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}
}
