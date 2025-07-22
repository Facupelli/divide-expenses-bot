import "dotenv/config";
import cors from "cors";
import express from "express";
import { AIService } from "./ai/ai.service";
import { OpenAIAdapter } from "./ai/open-ai-adapter";
import { ChatService } from "./chat/chat.service";
import { ClosegroupCommand } from "./chat/commands/close-group.command";
import { CommandRegistry } from "./chat/commands/command-registry";
import { GetExpensesCommand } from "./chat/commands/get-expenses.command copy";
import { GetPayoutCommand } from "./chat/commands/get-payouts.command";
import { TelegramService } from "./chat/telegram/telegram.service";
import { TelegramChatAdapter } from "./chat/telegram/telegram-chat-adapter";
import type {
	TelegramMessage,
	TelegramUpdate,
} from "./chat/types/telegram.type";
import { ChatExpenseService } from "./expense/chat-expense.service";
import { ExpenseService } from "./expense/expense.service";
import { SqliteExpenseRepository } from "./expense/expense.sqlite.repository";
import { GroupService } from "./group/group.service";
import { SqliteGroupRepository } from "./group/group.sqlite.repository";
import { ChatUserService } from "./user/chat-user.service";
import { UserService } from "./user/user.service";
import { SqliteUserRepository } from "./user/user.sqlite.repository";

const openaiApiKey = process.env.OPENAI_API_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramWebhook = process.env.TELEGRAM_WEBHOOK_URL;

if (!openaiApiKey || !telegramToken || !telegramWebhook) {
	throw new Error("ENV variable missing");
}

const telegramAdapter = new TelegramChatAdapter(telegramToken, telegramWebhook);
const openaiAdapter = new OpenAIAdapter(openaiApiKey);

const userRepository = new SqliteUserRepository();
const expenseRepository = new SqliteExpenseRepository();
const groupRepository = new SqliteGroupRepository();

const expenseService = new ExpenseService(expenseRepository);
const chatService = new ChatService(telegramAdapter);
const groupService = new GroupService(groupRepository);
const userService = new UserService(userRepository);

const chatUserService = new ChatUserService(userService, groupService);
const chatExpenseService = new ChatExpenseService(expenseService, groupService);

const registry = new CommandRegistry()
	.register(new ClosegroupCommand(groupService))
	.register(new GetPayoutCommand(chatExpenseService))
	.register(new GetExpensesCommand(chatExpenseService));

const telegramService = new TelegramService(telegramAdapter);
const aiService = new AIService(
	openaiAdapter,
	chatUserService,
	chatExpenseService,
	groupService,
);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/webhook-info", async (_, res, __) => {
	await chatService.getWebhookInfo();
	return res.sendStatus(200);
});

app.post("/commands", async (req, res, _) => {
	const body = req.body;

	await telegramService.setCommands(body.commands, body.scope);
	return res.sendStatus(200);
});

app.post("/bot-name", async (req, res, _) => {
	const body = req.body;

	await telegramService.setBotName(body.name);
	return res.sendStatus(200);
});

app.post("/webhook", async (req, res, _) => {
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
});

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`);
});
