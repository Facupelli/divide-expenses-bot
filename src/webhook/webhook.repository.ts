import { asc, eq, inArray } from "drizzle-orm";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "../bot/types/telegram.type";
import type { DB } from "../db";
import { outboundMessages, telegramUpdates } from "../db/schema";

export interface StoredTelegramUpdate {
	updateId: number;
	message: TelegramMessage;
	status: "received" | "processing" | "completed";
}

export interface OutboundMessage {
	id: number;
	chatId: number;
	text: string;
	status: "pending" | "sent";
}

export class WebhookRepository {
	constructor(private readonly db: DB) {}

	async receive(update: TelegramUpdate): Promise<void> {
		if (update.message == null) {
			return;
		}

		await this.db
			.insert(telegramUpdates)
			.values({
				updateId: update.update_id,
				chatId: String(update.message.chat.id),
				payload: JSON.stringify(update.message),
			})
			.onConflictDoNothing({ target: telegramUpdates.updateId });
	}

	async getUpdate(updateId: number): Promise<StoredTelegramUpdate | null> {
		const row = await this.db.query.telegramUpdates.findFirst({
			where: eq(telegramUpdates.updateId, updateId),
		});

		if (row == null) {
			return null;
		}

		return {
			updateId: row.updateId,
			message: JSON.parse(row.payload) as TelegramMessage,
			status: row.status,
		};
	}

	async markProcessing(updateId: number): Promise<void> {
		await this.db
			.update(telegramUpdates)
			.set({ status: "processing", lastError: null })
			.where(eq(telegramUpdates.updateId, updateId));
	}

	async markFailed(updateId: number, error: unknown): Promise<void> {
		const message = error instanceof Error ? error.message : String(error);
		await this.db
			.update(telegramUpdates)
			.set({ status: "received", lastError: message })
			.where(eq(telegramUpdates.updateId, updateId));
	}

	async complete(
		updateId: number,
		chatId: number,
		responses: string[],
	): Promise<number[]> {
		return this.db.transaction((tx) => {
			if (responses.length > 0) {
				tx.insert(outboundMessages)
					.values(
						responses.map((text, sequence) => ({
							updateId,
							sequence,
							chatId: String(chatId),
							text,
						})),
					)
					.onConflictDoNothing()
					.run();
			}

			tx.update(telegramUpdates)
				.set({
					status: "completed",
					completedAt: new Date(),
					lastError: null,
				})
				.where(eq(telegramUpdates.updateId, updateId))
				.run();

			return tx
				.select({ id: outboundMessages.id })
				.from(outboundMessages)
				.where(eq(outboundMessages.updateId, updateId))
				.orderBy(asc(outboundMessages.sequence))
				.all()
				.map(({ id }) => id);
		});
	}

	async getOutboundMessage(id: number): Promise<OutboundMessage | null> {
		const row = await this.db.query.outboundMessages.findFirst({
			where: eq(outboundMessages.id, id),
		});

		if (row == null) {
			return null;
		}

		return {
			id: row.id,
			chatId: Number(row.chatId),
			text: row.text,
			status: row.status,
		};
	}

	async markOutboundSent(id: number): Promise<void> {
		await this.db
			.update(outboundMessages)
			.set({ status: "sent", sentAt: new Date() })
			.where(eq(outboundMessages.id, id));
	}

	async getOutboundIdsForUpdate(updateId: number): Promise<number[]> {
		return this.db
			.select({ id: outboundMessages.id })
			.from(outboundMessages)
			.where(eq(outboundMessages.updateId, updateId))
			.orderBy(asc(outboundMessages.sequence))
			.then((rows) => rows.map(({ id }) => id));
	}

	async getRecoverableUpdateIds(): Promise<number[]> {
		return this.db
			.select({ updateId: telegramUpdates.updateId })
			.from(telegramUpdates)
			.where(inArray(telegramUpdates.status, ["received", "processing"]))
			.orderBy(asc(telegramUpdates.updateId))
			.then((rows) => rows.map(({ updateId }) => updateId));
	}

	async getPendingOutboundIds(): Promise<number[]> {
		return this.db
			.select({ id: outboundMessages.id })
			.from(outboundMessages)
			.where(eq(outboundMessages.status, "pending"))
			.orderBy(asc(outboundMessages.id))
			.then((rows) => rows.map(({ id }) => id));
	}
}
