import { insertUserSchema } from "../db/schema";
import { SqliteUserRepository } from "./user.sqlite.repository";

export class UserService {
  constructor(private userRepository: SqliteUserRepository) {}

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
