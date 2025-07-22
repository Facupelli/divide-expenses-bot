import type { Request, Response } from "express";
import { TelegramService } from "../chat/telegram/telegram.service";
import { TelegramChatAdapter } from "../chat/telegram/telegram-chat-adapter";
import type {
	SetBotNameBody,
	SetCommandsBody,
} from "../validators/telegram.validator";

const telegramAdapter = new TelegramChatAdapter();
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
