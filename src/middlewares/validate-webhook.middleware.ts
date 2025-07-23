import type { NextFunction, Request, Response } from "express";
import type { Deps } from "../composition";

export function createWebhookValidator(deps: Pick<Deps, "chatService">) {
	const { chatService } = deps;

	return {
		validateWebhookSign(req: Request, res: Response, next: NextFunction) {
			const isValidWebhook = chatService.validateWebhook(req);

			if (!isValidWebhook) {
				return res.sendStatus(200);
			}

			next();
		},
	};
}
