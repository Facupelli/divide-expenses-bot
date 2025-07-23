import type { Request, Response } from "express";
import type { Deps } from "../composition";
import type {
	SetBotNameBody,
	SetCommandsBody,
} from "../validators/telegram.validator";

export function createTelegramController(
	deps: Pick<Deps, "telegramService" | "chatService">,
) {
	const { telegramService, chatService } = deps;

	return {
		async setCommands(req: Request, res: Response) {
			const body = req.body as SetCommandsBody;

			await telegramService.setCommands(body.commands, body.scope);
			return res.sendStatus(200);
		},

		async setBotName(req: Request, res: Response) {
			const body = req.body as SetBotNameBody;

			await telegramService.setBotName(body.name);
			return res.sendStatus(200);
		},

		async setWebhook(_: Request, res: Response) {
			await chatService.setWebhook();
			return res.sendStatus(201);
		},
	};
}
