import { Queue } from "bullmq";
import { redis } from "./connection";

export interface OutboundJobData {
	outboundMessageId: number;
}

export const outboundQueue = new Queue<OutboundJobData>("telegram-outbound", {
	connection: redis,
	defaultJobOptions: {
		removeOnComplete: { age: 60 * 60 },
		removeOnFail: { age: 24 * 60 * 60 },
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
	},
});

export async function enqueueOutboundMessage(
	outboundMessageId: number,
): Promise<void> {
	const jobId = `telegram-outbound-${outboundMessageId}`;
	const existingJob = await outboundQueue.getJob(jobId);

	if (existingJob != null) {
		if ((await existingJob.getState()) === "failed") {
			await existingJob.retry();
		}
		return;
	}

	await outboundQueue.add(
		"telegram-send-message",
		{ outboundMessageId },
		{ jobId },
	);
}
