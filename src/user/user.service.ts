import { SqliteUserRepository } from "./user.sqlite.repository";

export class UserService {
  constructor(private userRepository: SqliteUserRepository) {}

  async checkUserIsInParticipants(userName: string): Promise<boolean> {
    const users = await this.userRepository.getAll();

    return users.some((user) => user.name === userName);
  }
}
