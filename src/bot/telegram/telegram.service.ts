import type { TelegramChatAdapter } from "./telegram-chat-adapter";

export class TelegramService {
	constructor(private telegramAdapter: TelegramChatAdapter) {}

	async setCommands(
		commands: { command: string; description: string }[],
		scope?: string,
	) {
		return await this.telegramAdapter.setCommands(commands, scope);
	}

	async setBotName(name: string) {
		return await this.telegramAdapter.setBotName(name);
	}
}
