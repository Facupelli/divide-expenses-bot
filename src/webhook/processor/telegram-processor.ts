import type { Job } from "bullmq";
import { deps } from "../../composition";
import { enqueueOutboundMessage } from "../queue/outbound-queue";
import type { TelegramJobData } from "../queue/telegram-queue";

export async function telegramProcessor(
	job: Job<TelegramJobData>,
): Promise<void> {
	const { updateId } = job.data;
	const update = await deps.webhookRepository.getUpdate(updateId);

	if (update == null) {
		throw new Error(`Telegram update ${updateId} was not persisted`);
	}

	if (update.status === "completed") {
		const outboundIds =
			await deps.webhookRepository.getOutboundIdsForUpdate(updateId);
		for (const outboundId of outboundIds) {
			await enqueueOutboundMessage(outboundId);
		}
		return;
	}

	await deps.webhookRepository.markProcessing(updateId);

	let outboundIds: number[];
	try {
		const responses = await deps.webhookService.handleMessage(
			update.message,
			`telegram-update:${updateId}`,
		);
		outboundIds = await deps.webhookRepository.complete(
			updateId,
			update.message.chat.id,
			responses,
		);
	} catch (error) {
		await deps.webhookRepository.markFailed(updateId, error);
		throw error;
	}

	for (const outboundId of outboundIds) {
		await enqueueOutboundMessage(outboundId);
	}
}
