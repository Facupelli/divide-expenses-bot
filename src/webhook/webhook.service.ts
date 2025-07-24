import type { ChatService } from "../bot/chat.service";
import type { CommandRegistry } from "../bot/commands/command-registry";
import type { TelegramMessage } from "../bot/types/telegram.type";
import type { AIService } from "../modules/ai/ai.service";

export class WebhookService {
	constructor(
		private aiService: AIService,
		private commandRegistry: CommandRegistry,
		private chatService: ChatService,
	) {}

	// TODO: create UniversalMessage interface to handle multiplatform
	async handleMessage(message: TelegramMessage) {
		const entities = message.entities;
		const text = message.text;
		const chatId = message.chat.id;

		if (text == null) {
			return;
		}

		const cmdEntity = entities?.find((e) => e.type === "bot_command");

		if (cmdEntity != null && text != null) {
			const command = this.commandRegistry.get(text);
			if (command) {
				const commandResult = await command.execute(chatId, message);
				await this.chatService.sendMessage(chatId, commandResult.message);
				return;
			}
		}

		const response = await this.aiService.createResponse(chatId, text);

		if (response == null) {
			return;
		}

		if (Array.isArray(response)) {
			for (const r of response) {
				await this.chatService.sendMessage(chatId, r);
			}
		} else {
			await this.chatService.sendMessage(chatId, response);
		}
	}
}
