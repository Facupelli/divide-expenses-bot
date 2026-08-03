import assert from "node:assert/strict";
import test from "node:test";
import { CommandRegistry } from "../bot/commands/command-registry";
import { StaticMessageCommand } from "../bot/commands/static-message.command";
import {
	createHelpMessage,
	createStartMessage,
} from "../bot/messages/factories/help.factory";
import type { TelegramMessage } from "../bot/types/telegram.type";
import type { AIService } from "../modules/ai/ai.service";
import { WebhookService } from "./webhook.service";

function commandMessage(text: string): TelegramMessage {
	return {
		message_id: 1,
		date: 0,
		chat: { id: 123, type: "group" },
		text,
		entities: [{ type: "bot_command", offset: 0, length: text.length }],
	};
}

test("all supported commands are handled locally without calling AI", async () => {
	let aiCalls = 0;
	const aiService = {
		async createResponse() {
			aiCalls += 1;
			return "AI response";
		},
	} as unknown as AIService;
	const registry = new CommandRegistry();

	for (const name of [
		"start",
		"ayuda",
		"ver_gastos",
		"ajuste_cuentas",
		"cerrar_grupo",
	]) {
		registry.register(new StaticMessageCommand(name, `local:${name}`));
	}

	const service = new WebhookService(aiService, registry);
	for (const name of [
		"start",
		"ayuda",
		"ver_gastos",
		"ajuste_cuentas",
		"cerrar_grupo",
	]) {
		assert.deepEqual(
			await service.handleMessage(commandMessage(`/${name}`), "update:1"),
			[`local:${name}`],
		);
	}
	assert.equal(aiCalls, 0);
});

test("commands with a bot username suffix are handled locally", async () => {
	const aiService = {
		async createResponse() {
			throw new Error("AI must not be called for a local command");
		},
	} as unknown as AIService;
	const registry = new CommandRegistry().register(
		new StaticMessageCommand("ayuda", "local help"),
	);
	const service = new WebhookService(aiService, registry);

	assert.deepEqual(
		await service.handleMessage(
			commandMessage("/ayuda@DivideExpensesBot"),
			"update:2",
		),
		["local help"],
	);
});

test("start and help messages are written in Spanish and contain realistic guidance", () => {
	const start = createStartMessage();
	const help = createHelpMessage();

	assert.ok(start.includes("¡Hola!"));
	assert.ok(start.includes("Ana pagó $24.000 de cena"));
	assert.ok(start.includes("/ayuda"));
	assert.ok(help.includes("Si no aclarás la división"));
	assert.ok(help.includes("entre Beto, Carla y Diego"));
	assert.ok(help.includes("/ver_gastos"));
	assert.ok(help.includes("/ajuste_cuentas"));
	assert.ok(help.includes("/cerrar_grupo"));
});
