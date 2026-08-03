import assert from "node:assert/strict";
import test from "node:test";
import { KeyedTaskScheduler } from "./keyed-task-scheduler";

function deferred(): {
	promise: Promise<void>;
	resolve: () => void;
} {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

test("independent chats are processed concurrently", async () => {
	const scheduler = new KeyedTaskScheduler<number>();
	const firstChat = deferred();
	let secondChatStarted = false;

	const first = scheduler.run(1, async () => {
		await firstChat.promise;
	});
	const second = scheduler.run(2, async () => {
		secondChatStarted = true;
	});

	await second;
	assert.equal(secondChatStarted, true);
	firstChat.resolve();
	await first;
});

test("messages from one chat are processed sequentially", async () => {
	const scheduler = new KeyedTaskScheduler<number>();
	const firstMessage = deferred();
	const firstStarted = deferred();
	const events: string[] = [];

	const first = scheduler.run(1, async () => {
		events.push("first:start");
		firstStarted.resolve();
		await firstMessage.promise;
		events.push("first:end");
	});
	const second = scheduler.run(1, async () => {
		events.push("second:start");
	});

	await firstStarted.promise;
	assert.deepEqual(events, ["first:start"]);
	firstMessage.resolve();
	await Promise.all([first, second]);
	assert.deepEqual(events, ["first:start", "first:end", "second:start"]);
	assert.equal(scheduler.activeKeyCount, 0);
});

test("a failed task does not block the next message", async () => {
	const scheduler = new KeyedTaskScheduler<number>();
	const first = scheduler.run(1, async () => {
		throw new Error("failed");
	});
	const second = scheduler.run(1, async () => "processed");

	await assert.rejects(first, /failed/);
	assert.equal(await second, "processed");
	assert.equal(scheduler.activeKeyCount, 0);
});
