import type { Request } from "express";

export interface ChatProvider {
	sendMessage(chatId: number, text: string): Promise<void>;
	setWebhook(): Promise<void>;
	getWebhookInfo(): Promise<void>;
	validateWebhook(req: Request): Promise<boolean>;
}

export class ChatError extends Error {}
