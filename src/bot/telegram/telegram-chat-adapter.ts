import type { Request } from "express";
import type { ChatProvider } from "../types";

export class TelegramChatAdapter implements ChatProvider {
	private readonly telegramUrl: string;
	private readonly webhookUrl: string;

	constructor(params: {
		botToken: string;
		webhookUrl: string;
	}) {
		this.telegramUrl = `https://api.telegram.org/bot${params.botToken}`;
		this.webhookUrl = params.webhookUrl;
	}

	async sendMessage(chatId: number, text: string): Promise<void> {
		try {
			const requestUrl = `${this.telegramUrl}/sendMessage`;

			const response = await fetch(requestUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					chat_id: chatId,
					text,
					// parse_mode: "MarkdownV2",
				}),
			});

			const data = await response.json();
			console.log({ data });
		} catch (error) {
			console.error("[TELEGRAM SEND_MESSAGE] error:", { error });
			throw error;
		}
	}

	async validateWebhook(req: Request): Promise<boolean> {
		const headers = req.headers;

		const requestSecret = headers["x-telegram-bot-api-secret-token"];

		if ("supersecrettoken" !== requestSecret) {
			console.warn("Telegram Webhook Request Secret Mismatch");
			return false;
		}

		return true;
	}

	async setWebhook(): Promise<void> {
		try {
			const requestUrl = `${this.telegramUrl}/setWebhook`;

			const response = await fetch(requestUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url: `${this.webhookUrl}/webhook`,
					secret_token: "supersecrettoken",
					drop_pending_updates: true,
					allowed_updates: ["message"],
				}),
			});

			const data = await response.json();
			console.log({ data });
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async getWebhookInfo(): Promise<void> {
		try {
			const requestUrl = `${this.telegramUrl}/getWebhookInfo`;

			const response = await fetch(requestUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();
			console.log({ data });
		} catch (error) {
			console.error({ error });
			throw error;
		}
	}

	async setCommands(
		commands: { command: string; description: string }[],
		scope?: string,
	): Promise<void> {
		const requestUrl = `${this.telegramUrl}/setMyCommands`;

		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				commands,
				scope,
			}),
		});

		const data = await response.json();

		console.log({ data });
	}

	async setBotName(name: string) {
		const requestUrl = `${this.telegramUrl}/setMyName`;

		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
			}),
		});

		const data = await response.json();

		console.log({ data });
	}
}
