import type { GroupService } from "../domain/group/group.service";
import type { UserService } from "./user.service";

export class ChatUserService {
	constructor(
		private userService: UserService,
		private groupService: GroupService,
	) {}

	async addUsers(names: string[], chatId: string) {
		try {
			const chatHasActiveGroup = await this.groupService.getHasActive(chatId);

			if (chatHasActiveGroup) {
				return {
					success: false,
					message: "Ya tenes un grupo activo. Cerralo y crea uno nuevo!",
				};
			}

			const newGroup = await this.groupService.save({
				chatId,
				isActive: true,
			});

			await this.userService.saveMultiple(names, newGroup.id);

			const message = [
				"✅ Participantes agregados al grupo",
				"",
				names.map((name) => `- ${name}`).join("\n"),
			].join("\n");

			return { success: true, message };
		} catch (error) {
			console.error("ADD_USER ERROR:", { error });
			return { success: false, message: "Hubo un error" };
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
			return { success: false, message: "Hubo un error" };
		}
	}
}
