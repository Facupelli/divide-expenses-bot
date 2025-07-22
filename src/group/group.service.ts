import { insertGroupSchema, NewGroup } from "../db/schema";
import { SqliteGroupRepository } from "./group.sqlite.repository";

export class GroupService {
  constructor(private groupRepository: SqliteGroupRepository) {}

  async checkUserIsInGroup(userName: string, chatId: string): Promise<boolean> {
    const users = await this.groupRepository.getUsers(chatId);

    return users.some((name) => name === userName);
  }

  async save(newGroup: NewGroup): Promise<{ id: number }> {
    const validatedData = insertGroupSchema.parse(newGroup);

    return await this.groupRepository.save(validatedData);
  }

  async getHasActive(chatId: string) {
    return await this.groupRepository.getHasActive(chatId);
  }

  async getUsers(chatId: string) {
    return await this.groupRepository.getUsers(chatId);
  }

  async getActive(chatId: string): Promise<number | null> {
    return await this.groupRepository.getActive(chatId);
  }

  async close(chatId: string) {
    return await this.groupRepository.close(chatId);
  }
}
