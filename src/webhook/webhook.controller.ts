import type { Request, Response } from "express";
import type { TelegramUpdate } from "../bot/types/telegram.type";
import type { Deps } from "../composition";
import { msgLimiter } from "../infra/rate-limiter";
import { enqueueTelegramUpdate } from "./queue/telegram-queue";

export function createWebhookController(
	deps: Pick<Deps, "chatService" | "webhookRepository">,
) {
	const { chatService, webhookRepository } = deps;

	return {
		async handleWebhook(req: Request, res: Response) {
			const update: TelegramUpdate = req.body;
			const message = update.message;

			if (message == null) {
				return res.sendStatus(200);
			}

			try {
				await webhookRepository.receive(update);
				await enqueueTelegramUpdate(update.update_id);
			} catch (error) {
				console.error("[HANDLE-WEBHOOK] durable ingestion failed", { error });
				return res.sendStatus(503);
			}

			try {
				await msgLimiter.consume(String(message.chat.id));
			} catch (_) {
				try {
					await chatService.sendMessage(
						message.chat.id,
						"⏳ Por favor esepera unos segundos antes de enviar otro mensaje.",
					);
				} catch (error) {
					console.error("[HANDLE-WEBHOOK] rate-limit warning failed", {
						error,
					});
				}
			}

			return res.sendStatus(200);
		},

		async getWebhookInfo(_: Request, res: Response) {
			await chatService.getWebhookInfo();
			return res.sendStatus(200);
		},
	};
}
