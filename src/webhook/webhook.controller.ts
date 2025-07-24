import type { Request, Response } from "express";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "../bot/types/telegram.type";
import type { Deps } from "../composition";
import { msgLimiter } from "../infra/rate-limiter";
import { telegramQueue } from "./queue/telegram-queue";

export function createWebhookController(deps: Pick<Deps, "chatService">) {
	const { chatService } = deps;

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

			try {
				await telegramQueue.add(
					"telegram-message",
					{ chatId, payload: message },
					{
						attempts: 3,
						backoff: { type: "exponential", delay: 2000 },
						removeOnComplete: { age: 60 * 60 },
						removeOnFail: { age: 24 * 60 * 60 },
					},
				);
			} catch (error) {
				console.log("[HANDLE-WEBHOOK] add to telegram-queue ERROR", { error });
			}

			return res.sendStatus(200);
		},

		async getWebhookInfo(_: Request, res: Response) {
			await chatService.getWebhookInfo();
			return res.sendStatus(200);
		},
	};
}
