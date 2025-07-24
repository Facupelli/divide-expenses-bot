import type { Job } from "bullmq";
import { deps } from "../../composition";
import type { TelegramJobData } from "../queue/telegram-queue";

export async function telegramProcessor(
	job: Job<TelegramJobData>,
): Promise<void> {
	const { payload } = job.data;

	await deps.webhookService.handleMessage(payload);
}
