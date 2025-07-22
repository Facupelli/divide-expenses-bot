import { insertUserSchema } from "../db/schema";
import { SqliteUserRepository } from "./user.sqlite.repository";

export class ChatUserService {
  constructor(private userRepository: SqliteUserRepository) {}

  async addUsers(names: string[]) {
    try {
      const validated = names.map((n) => insertUserSchema.parse({ name: n }));

      await this.userRepository.saveMultiple(validated);

      const message = `✅ Participantes agregados al grupo:
      
      - ${names.join(", ")}
      `;

      return { success: true, message };
    } catch (error) {
      console.error("ADD_USER ERROR:", { error });
      return { success: false, message: "Hubo un error" };
    }
  }

  async getAllUsers() {
    try {
      const result = await this.userRepository.getAll();
      return {
        success: true,
        message: `${result.map((user) => user.name).join(", ")}`,
      };
    } catch (error) {
      return { success: false, message: "Hubo un error" };
    }
  }
}
