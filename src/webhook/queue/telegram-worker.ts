import { Worker } from "bullmq";
import { deps } from "../../composition";
import { telegramProcessor } from "../processor/telegram-processor";
import { redis } from "./connection";
import { enqueueTelegramUpdate } from "./telegram-queue";

export const telegramWorker = new Worker(
	"telegram-webhook",
	telegramProcessor,
	{
		connection: redis,
		concurrency: 1,
	},
);

telegramWorker.on("ready", async () => {
	console.log("Telegram worker ready");
	try {
		const updateIds = await deps.webhookRepository.getRecoverableUpdateIds();
		for (const updateId of updateIds) {
			await enqueueTelegramUpdate(updateId);
		}
	} catch (error) {
		console.error("Failed to recover Telegram updates", error);
	}
});

telegramWorker.on("failed", (job, error) =>
	console.error("Job failed", job?.id, error),
);
