import type { Request, Response } from "express";
import { TelegramService } from "../chat/telegram/telegram.service";
import { TelegramChatAdapter } from "../chat/telegram/telegram-chat-adapter";
import type {
	SetBotNameBody,
	SetCommandsBody,
} from "../validators/telegram.validator";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramWebhook = process.env.TELEGRAM_WEBHOOK_URL;

if (!telegramToken || !telegramWebhook) {
	throw new Error("ENV variable missing");
}

const telegramAdapter = new TelegramChatAdapter(telegramToken, telegramWebhook);
const telegramService = new TelegramService(telegramAdapter);

export const setCommands = async (req: Request, res: Response) => {
	const body = req.body as SetCommandsBody;

	await telegramService.setCommands(body.commands, body.scope);
	return res.sendStatus(200);
};

export const setBotName = async (req: Request, res: Response) => {
	const body = req.body as SetBotNameBody;

	await telegramService.setBotName(body.name);
	return res.sendStatus(200);
};
