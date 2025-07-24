import { Queue } from "bullmq";
import type { TelegramMessage } from "../../bot/types/telegram.type";
import { redis } from "./connection";

export interface TelegramJobData {
	chatId: number;
	payload: TelegramMessage;
}

export const telegramQueue = new Queue<TelegramJobData>("telegram-webhook", {
	connection: redis,
	defaultJobOptions: {
		removeOnComplete: { age: 60 * 60 }, // keep 1h
		removeOnFail: { age: 24 * 60 * 60 },
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
	},
});
