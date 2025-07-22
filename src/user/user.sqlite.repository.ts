import { db } from "../db";
import { User, users } from "../db/schema";
import { DatabaseError, UserRepository } from "./user.repository";

export class SqliteUserRepository implements UserRepository {
  async save(user: User): Promise<void> {}
  async findById(id: string): Promise<User | null> {
    return null;
  }

  async saveMultiple(userNames: { name: string }[]): Promise<void> {
    try {
      await db.insert(users).values(userNames);
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async getAll(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }
}
