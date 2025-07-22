import type { Request, Response } from "express";
import { ChatService } from "../chat/chat.service";
import { ClosegroupCommand } from "../chat/commands/close-group.command";
import { CommandRegistry } from "../chat/commands/command-registry";
import { GetExpensesCommand } from "../chat/commands/get-expenses.command copy";
import { GetPayoutCommand } from "../chat/commands/get-payouts.command";
import { TelegramChatAdapter } from "../chat/telegram/telegram-chat-adapter";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "../chat/types/telegram.type";
import { AIService } from "../domain/ai/ai.service";
import { OpenAIAdapter } from "../domain/ai/open-ai-adapter";
import { ChatExpenseService } from "../domain/expense/chat-expense.service";
import { ExpenseService } from "../domain/expense/expense.service";
import { SqliteExpenseRepository } from "../domain/expense/expense.sqlite.repository";
import { GroupService } from "../domain/group/group.service";
import { SqliteGroupRepository } from "../domain/group/group.sqlite.repository";
import { ChatUserService } from "../domain/user/chat-user.service";
import { UserService } from "../domain/user/user.service";
import { SqliteUserRepository } from "../domain/user/user.sqlite.repository";

// Adapters
const telegramAdapter = new TelegramChatAdapter();
const openaiAdapter = new OpenAIAdapter();

// Repositories
const userRepository = new SqliteUserRepository();
const expenseRepository = new SqliteExpenseRepository();
const groupRepository = new SqliteGroupRepository();

// General Services
const expenseService = new ExpenseService(expenseRepository);
const chatService = new ChatService(telegramAdapter);
const groupService = new GroupService(groupRepository);
const userService = new UserService(userRepository);

// Chat Services
const chatUserService = new ChatUserService(userService, groupService);
const chatExpenseService = new ChatExpenseService(expenseService, groupService);

const registry = new CommandRegistry()
	.register(new ClosegroupCommand(groupService))
	.register(new GetPayoutCommand(chatExpenseService))
	.register(new GetExpensesCommand(chatExpenseService));

const aiService = new AIService(
	openaiAdapter,
	chatUserService,
	chatExpenseService,
);

export async function handleWebhook(req: Request, res: Response) {
	const isValidWebhook = chatService.validateWebhook(req);

	if (!isValidWebhook) {
		return res.sendStatus(200);
	}

	const update: TelegramUpdate = req.body;
	const message: TelegramMessage | undefined = update.message;
	// console.dir({ update }, { depth: null });

	if (message == null) {
		return res.sendStatus(200);
	}

	const entities = message.entities;
	const text = message.text;
	const chatId = message.chat.id;

	if (text == null) {
		return res.sendStatus(200);
	}

	const cmdEntity = entities?.find((e) => e.type === "bot_command");

	if (cmdEntity != null && text != null) {
		const command = registry.get(text);
		if (command) {
			const commandResult = await command.execute(chatId, message);
			await chatService.sendMessage(chatId, commandResult.message);
			return res.sendStatus(200);
		}
	}

	const response = await aiService.createResponse(chatId, text);
	if (response != null) {
		await chatService.sendMessage(chatId, response);
	}

	return res.sendStatus(200);
}

export async function getWebhookInfo(_: Request, res: Response) {
	await chatService.getWebhookInfo();
	return res.sendStatus(200);
}
