import { Worker } from "bullmq";
import { telegramProcessor } from "../processor/telegram-processor";
import { redis } from "./connection";

export const telegramWorker = new Worker(
	"telegram-webhook",
	telegramProcessor,
	{
		connection: redis,
		concurrency: 1,
	},
);

// optional: log when it is ready
telegramWorker.on("ready", () => console.log("Telegram worker ready"));
telegramWorker.on("failed", (job, err) =>
	console.error("Job failed", job?.id, err),
);
