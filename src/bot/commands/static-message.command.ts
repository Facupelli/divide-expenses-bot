import type { TelegramMessage } from "../types/telegram.type";
import type { ICommand, ICommandResponse } from "./types";

export class StaticMessageCommand implements ICommand {
	constructor(
		readonly name: string,
		private readonly message: string,
	) {}

	execute(_chatId: number, _msg: TelegramMessage): ICommandResponse {
		return { success: true, message: this.message };
	}
}
