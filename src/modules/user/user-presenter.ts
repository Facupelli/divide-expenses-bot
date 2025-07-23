import {
	createErrorUserMessage,
	createSuccessUserMessage,
} from "../../bot/messages/factories/user.factory";
import type { GroupService } from "../group/group.service";
import type { UserService } from "./user.service";

export class UserPresenter {
	constructor(
		private userService: UserService,
		private groupService: GroupService,
	) {}

	async addUsers(names: string[], chatId: string) {
		try {
			await this.userService.saveMultiple(names, chatId);
			const message = createSuccessUserMessage(names);
			return { success: true, message };
		} catch (error) {
			return {
				success: false,
				message: createErrorUserMessage(error),
			};
		}
	}

	async getUsers(chatId: string) {
		try {
			const result = await this.groupService.getUsers(chatId);
			return {
				success: true,
				message: `${result.map((name) => name).join(", ")}`,
			};
		} catch (error) {
			return {
				success: false,
				message: createErrorUserMessage(error),
			};
		}
	}
}
