import { Queue } from "bullmq";
import { redis } from "./connection";

export interface TelegramJobData {
	updateId: number;
	chatId: number;
}

export const telegramQueue = new Queue<TelegramJobData>("telegram-webhook", {
	connection: redis,
	defaultJobOptions: {
		removeOnComplete: { age: 60 * 60 },
		removeOnFail: { age: 24 * 60 * 60 },
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
	},
});

export async function enqueueTelegramUpdate(
	updateId: number,
	chatId: number,
): Promise<void> {
	const jobId = `telegram-update-${updateId}`;
	const existingJob = await telegramQueue.getJob(jobId);

	if (existingJob != null) {
		if ((await existingJob.getState()) === "failed") {
			await existingJob.retry();
		}
		return;
	}

	await telegramQueue.add("telegram-message", { updateId, chatId }, { jobId });
}
