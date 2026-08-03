import type { Job } from "bullmq";
import { deps } from "../../composition";
import type { OutboundJobData } from "../queue/outbound-queue";

export async function outboundProcessor(
	job: Job<OutboundJobData>,
): Promise<void> {
	const message = await deps.webhookRepository.getOutboundMessage(
		job.data.outboundMessageId,
	);

	if (message == null) {
		throw new Error(
			`Outbound message ${job.data.outboundMessageId} was not persisted`,
		);
	}

	if (message.status === "sent") {
		return;
	}

	await deps.chatService.sendMessage(message.chatId, message.text);
	await deps.webhookRepository.markOutboundSent(message.id);
}
