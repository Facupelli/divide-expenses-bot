import type { GroupService } from "../../modules/group/group.service";
import {
	createErrorGroupMessage,
	createSuccessGroupMessage,
} from "../messages/factories/group.factory";
import type { TelegramMessage } from "../types/telegram.type";
import type { ICommand, ICommandResponse } from "./types";

export class ClosegroupCommand implements ICommand {
	constructor(private groupService: GroupService) {}

	readonly name = "cerrar_grupo";
	async execute(
		chatId: number,
		msg: TelegramMessage,
	): Promise<ICommandResponse> {
		console.log(`COMMAND [cerrar_grupo] triggered by ${msg.from?.first_name}`);
		try {
			await this.groupService.close(String(chatId));

			return {
				success: true,
				message: createSuccessGroupMessage(),
			};
		} catch (_) {
			return {
				success: false,
				message: createErrorGroupMessage(),
			};
		}
	}
}
