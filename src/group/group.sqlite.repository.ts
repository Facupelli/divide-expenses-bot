import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { Group, groups, NewGroup, users } from "../db/schema";
import { GroupRepository } from "./group.repository";
import { sql } from "drizzle-orm";

export class SqliteGroupRepository implements GroupRepository {
  async getHasActive(chatId: string): Promise<boolean> {
    try {
      const rows = await db
        .select({ one: sql`1`.as("one") })
        .from(groups)
        .where(and(eq(groups.chatId, chatId), eq(groups.isActive, true)))
        .limit(1);

      return rows.length > 0;
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async getActive(chatId: string): Promise<number | null> {
    try {
      const rows = await db
        .select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.chatId, chatId), eq(groups.isActive, true)));

      if (rows[0]) {
        return rows[0].id;
      }

      return null;
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async getUsers(chatId: string): Promise<string[]> {
    try {
      const rows = await db
        .select({ name: users.name, id: groups.id })
        .from(groups)
        .innerJoin(users, eq(users.groupId, groups.id))
        .where(and(eq(groups.chatId, chatId), eq(groups.isActive, true)));

      return rows.map((r) => r.name);
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async save(newGroup: NewGroup): Promise<{ id: number }> {
    try {
      const rows = await db
        .insert(groups)
        .values(newGroup)
        .returning({ id: groups.id });

      return rows[0];
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }

  async close(chatId: string): Promise<void> {
    try {
      await db
        .update(groups)
        .set({
          isActive: false,
        })
        .where(eq(groups.chatId, chatId));
    } catch (error) {
      console.error({ error });
      throw error;
    }
  }
}
