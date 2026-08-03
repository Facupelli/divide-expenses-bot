import type { ChatService } from "../bot/chat.service";

export interface ProcessingNotifier {
	start(chatId: number, idempotencyKey: string): () => void;
}

const DEFAULT_TYPING_REFRESH_MS = 4_000;
const DEFAULT_SLOW_NOTICE_DELAY_MS = 8_000;
const MAX_TRACKED_NOTICES = 10_000;
const SLOW_NOTICE =
	"Esto está tardando más de lo esperado. Sigo procesando tu mensaje...";

export class TelegramProcessingNotifier implements ProcessingNotifier {
	private readonly announcedKeys = new Set<string>();
	private readonly typingRefreshMs: number;
	private readonly slowNoticeDelayMs: number;

	constructor(
		private readonly chatService: ChatService,
		options: { typingRefreshMs?: number; slowNoticeDelayMs?: number } = {},
	) {
		this.typingRefreshMs = options.typingRefreshMs ?? DEFAULT_TYPING_REFRESH_MS;
		this.slowNoticeDelayMs =
			options.slowNoticeDelayMs ?? DEFAULT_SLOW_NOTICE_DELAY_MS;
	}

	start(chatId: number, idempotencyKey: string): () => void {
		this.sendTyping(chatId);
		const typingTimer = setInterval(
			() => this.sendTyping(chatId),
			this.typingRefreshMs,
		);
		const noticeTimer = setTimeout(() => {
			if (this.announcedKeys.has(idempotencyKey)) {
				return;
			}

			this.rememberNotice(idempotencyKey);
			void this.chatService
				.sendMessage(chatId, SLOW_NOTICE)
				.catch((error) =>
					console.warn("Failed to send slow-processing notice", error),
				);
		}, this.slowNoticeDelayMs);

		return () => {
			clearInterval(typingTimer);
			clearTimeout(noticeTimer);
		};
	}

	private sendTyping(chatId: number): void {
		void this.chatService
			.sendTyping(chatId)
			.catch((error) => console.warn("Failed to send typing activity", error));
	}

	private rememberNotice(idempotencyKey: string): void {
		this.announcedKeys.add(idempotencyKey);
		if (this.announcedKeys.size <= MAX_TRACKED_NOTICES) {
			return;
		}

		const oldestKey = this.announcedKeys.values().next().value;
		if (oldestKey != null) {
			this.announcedKeys.delete(oldestKey);
		}
	}
}
