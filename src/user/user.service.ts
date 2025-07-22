import { insertUserSchema } from "../db/schema";
import { GroupService } from "../group/group.service";
import { SqliteUserRepository } from "./user.sqlite.repository";

export class UserService {
  constructor(
    private userRepository: SqliteUserRepository,
    private groupService: GroupService
  ) {}

  async checkUserIsInParticipants(
    userName: string,
    chatId: string
  ): Promise<boolean> {
    const users = await this.groupService.getUsers(chatId);

    return users.some((name) => name === userName);
  }

  async saveMultiple(names: string[], groupId: number) {
    const validated = names.map((n) =>
      insertUserSchema.parse({ name: n, groupId })
    );

    return await this.userRepository.saveMultiple(validated);
  }

  async getAll() {
    return await this.userRepository.getAll();
  }
}
