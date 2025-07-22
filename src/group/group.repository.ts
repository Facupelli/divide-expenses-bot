import { Group, NewGroup } from "../db/schema";

export interface GroupRepository {
  save(newGroup: NewGroup): Promise<{ id: number }>;
  getHasActive(chatId: string): Promise<boolean>;
  getUsers(chatId: string): Promise<string[]>;
  getActive(chatId: string): Promise<number | null>;
  close(chatId: string): Promise<void>;
}
