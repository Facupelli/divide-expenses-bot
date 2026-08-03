import { Worker } from "bullmq";
import { deps } from "../../composition";
import { outboundProcessor } from "../processor/outbound-processor";
import { redis } from "./connection";
import { enqueueOutboundMessage } from "./outbound-queue";

export const outboundWorker = new Worker(
	"telegram-outbound",
	outboundProcessor,
	{
		connection: redis,
		concurrency: 1,
	},
);

outboundWorker.on("ready", async () => {
	console.log("Telegram outbound worker ready");
	try {
		const pendingIds = await deps.webhookRepository.getPendingOutboundIds();
		for (const pendingId of pendingIds) {
			await enqueueOutboundMessage(pendingId);
		}
	} catch (error) {
		console.error("Failed to recover outbound messages", error);
	}
});

outboundWorker.on("failed", (job, error) =>
	console.error("Outbound job failed", job?.id, error),
);
