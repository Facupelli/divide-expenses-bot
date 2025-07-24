import type { Request, Response } from "express";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "../bot/types/telegram.type";
import type { Deps } from "../composition";
import { msgLimiter } from "../infra/rate-limiter";

export function createWebhookController(
	deps: Pick<Deps, "webhookService" | "chatService">,
) {
	const { webhookService, chatService } = deps;

	return {
		async handleWebhook(req: Request, res: Response) {
			const update: TelegramUpdate = req.body;
			const message: TelegramMessage | undefined = update.message;
			// console.dir({ update }, { depth: null });

			if (message == null) {
				return res.sendStatus(200);
			}

			const chatId = message.chat.id;

			// RATE LIMITING
			try {
				await msgLimiter.consume(chatId.toString());
			} catch (_) {
				await chatService.sendMessage(
					chatId,
					"⏳ Por favor esepera unos segundos antes de enviar otro mensaje.",
				);
			}

			res.sendStatus(200);
			setImmediate(async () => {
				await webhookService.handleMessage(message);
			});
		},

		async getWebhookInfo(_: Request, res: Response) {
			await chatService.getWebhookInfo();
			return res.sendStatus(200);
		},
	};
}
