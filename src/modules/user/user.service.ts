import { insertUserSchema } from "../../db/schema";
import type { GroupService } from "../group/group.service";
import { ActiveGroupError } from "./user.errors";
import type { SqliteUserRepository } from "./user.sqlite.repository";

export class UserService {
	constructor(
		private userRepository: SqliteUserRepository,
		private groupService: GroupService,
	) {}

	async saveMultiple(names: string[], chatId: string) {
		const chatHasActiveGroup = await this.groupService.getHasActive(chatId);

		if (chatHasActiveGroup) {
			throw new ActiveGroupError();
		}

		const newGroup = await this.groupService.save({
			chatId,
			isActive: true,
		});

		const validated = names.map((n) =>
			insertUserSchema.parse({ name: n, groupId: newGroup.id }),
		);

		return await this.userRepository.saveMultiple(validated);
	}

	async getAll() {
		return await this.userRepository.getAll();
	}
}
