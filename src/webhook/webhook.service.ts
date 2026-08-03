import type { CommandRegistry } from "../bot/commands/command-registry";
import type { TelegramMessage } from "../bot/types/telegram.type";
import type { AIService } from "../modules/ai/ai.service";
import type { ProcessingNotifier } from "./processing-notifier";

export class WebhookService {
	constructor(
		private aiService: AIService,
		private commandRegistry: CommandRegistry,
		private processingNotifier?: ProcessingNotifier,
	) {}

	// TODO: create UniversalMessage interface to handle multiplatform
	async handleMessage(
		message: TelegramMessage,
		idempotencyKey: string,
	): Promise<string[]> {
		const entities = message.entities;
		const text = message.text;
		const chatId = message.chat.id;

		if (text == null) {
			return [];
		}

		const cmdEntity = entities?.find((entity) => entity.type === "bot_command");

		if (cmdEntity != null) {
			const command = this.commandRegistry.get(text);
			if (command) {
				const result = await command.execute(chatId, message);
				return [result.message];
			}
		}

		const stopNotifying =
			this.processingNotifier?.start(chatId, idempotencyKey) ??
			(() => undefined);
		try {
			const response = await this.aiService.createResponse(
				chatId,
				text,
				idempotencyKey,
			);

			if (response == null) {
				return [];
			}

			return Array.isArray(response) ? response : [response];
		} finally {
			stopNotifying();
		}
	}
}
