import assert from "node:assert/strict";
import test from "node:test";
import type { ChatService } from "../bot/chat.service";
import { TelegramProcessingNotifier } from "./processing-notifier";

function wait(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

test("shows activity and notifies the user when AI processing is slow", async () => {
	let typingCalls = 0;
	const messages: string[] = [];
	const chatService = {
		async sendTyping() {
			typingCalls += 1;
		},
		async sendMessage(_chatId: number, message: string) {
			messages.push(message);
		},
	} as unknown as ChatService;
	const notifier = new TelegramProcessingNotifier(chatService, {
		typingRefreshMs: 5,
		slowNoticeDelayMs: 10,
	});

	const stop = notifier.start(123, "update:1");
	await wait(18);
	stop();

	assert.ok(typingCalls >= 2);
	assert.deepEqual(messages, [
		"Esto está tardando más de lo esperado. Sigo procesando tu mensaje...",
	]);
});

test("stopping notifications clears pending feedback", async () => {
	let messageCalls = 0;
	const chatService = {
		async sendTyping() {},
		async sendMessage() {
			messageCalls += 1;
		},
	} as unknown as ChatService;
	const notifier = new TelegramProcessingNotifier(chatService, {
		typingRefreshMs: 5,
		slowNoticeDelayMs: 10,
	});

	const stop = notifier.start(123, "update:2");
	stop();
	await wait(15);

	assert.equal(messageCalls, 0);
});

test("a retry does not repeat the slow-processing notice", async () => {
	let messageCalls = 0;
	const chatService = {
		async sendTyping() {},
		async sendMessage() {
			messageCalls += 1;
		},
	} as unknown as ChatService;
	const notifier = new TelegramProcessingNotifier(chatService, {
		typingRefreshMs: 50,
		slowNoticeDelayMs: 5,
	});

	const stopFirst = notifier.start(123, "update:3");
	await wait(10);
	stopFirst();
	const stopRetry = notifier.start(123, "update:3");
	await wait(10);
	stopRetry();

	assert.equal(messageCalls, 1);
});
