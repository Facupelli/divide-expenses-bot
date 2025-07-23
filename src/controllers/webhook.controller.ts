import type { Request, Response } from "express";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "../chat/types/telegram.type";
import type { Deps } from "../composition";

export function createWebhookController(
	deps: Pick<Deps, "commandRegistry" | "aiService" | "chatService">,
) {
	const { aiService, chatService, commandRegistry } = deps;

	return {
		async handleWebhook(req: Request, res: Response) {
			const isValidWebhook = chatService.validateWebhook(req);

			if (!isValidWebhook) {
				return res.sendStatus(200);
			}

			const update: TelegramUpdate = req.body;
			const message: TelegramMessage | undefined = update.message;
			// console.dir({ update }, { depth: null });

			if (message == null) {
				return res.sendStatus(200);
			}

			const entities = message.entities;
			const text = message.text;
			const chatId = message.chat.id;

			if (text == null) {
				return res.sendStatus(200);
			}

			const cmdEntity = entities?.find((e) => e.type === "bot_command");

			if (cmdEntity != null && text != null) {
				const command = commandRegistry.get(text);
				if (command) {
					const commandResult = await command.execute(chatId, message);
					await chatService.sendMessage(chatId, commandResult.message);
					return res.sendStatus(200);
				}
			}

			const response = await aiService.createResponse(chatId, text);
			if (response != null) {
				await chatService.sendMessage(chatId, response);
			}

			return res.sendStatus(200);
		},

		async getWebhookInfo(_: Request, res: Response) {
			await chatService.getWebhookInfo();
			return res.sendStatus(200);
		},
	};
}
