import { insertUserSchema } from "../../db/schema";
import type { GroupService } from "../group/group.service";
import { indexParticipantNames } from "../participant-name";
import {
	ActiveGroupError,
	DuplicateParticipantNamesError,
	EmptyParticipantListError,
	EmptyParticipantNameError,
} from "./user.errors";
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

		if (names.length === 0) throw new EmptyParticipantListError();
		const trimmedNames = names.map((name) => name.trim());
		if (trimmedNames.some((name) => name.length === 0)) {
			throw new EmptyParticipantNameError();
		}

		const { conflicts } = indexParticipantNames(names);
		if (conflicts.length > 0) {
			throw new DuplicateParticipantNamesError(conflicts);
		}

		const newGroup = await this.groupService.save({
			chatId,
			isActive: true,
		});

		const validated = trimmedNames.map((name) =>
			insertUserSchema.parse({ name, groupId: newGroup.id }),
		);

		await this.userRepository.saveMultiple(validated);
		return trimmedNames;
	}

	async getAll() {
		return await this.userRepository.getAll();
	}
}
