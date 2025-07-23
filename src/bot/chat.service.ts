import type { Request } from "express";
import type { ChatProvider } from "./types";

export class ChatService {
	constructor(private chat: ChatProvider) {}

	async validateWebhook(req: Request) {
		return this.chat.validateWebhook(req);
	}

	async getWebhookInfo(): Promise<void> {
		return this.chat.getWebhookInfo();
	}

	async setWebhook(): Promise<void> {
		return this.chat.setWebhook();
	}

	async sendMessage(chatId: number, text: string) {
		return await this.chat.sendMessage(chatId, text);
	}
}
