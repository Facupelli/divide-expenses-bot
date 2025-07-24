import OpenAI from "openai";
import { ChatService } from "./bot/chat.service";
import { ClosegroupCommand } from "./bot/commands/close-group.command";
import { CommandRegistry } from "./bot/commands/command-registry";
import { GetExpensesCommand } from "./bot/commands/get-expenses.command copy";
import { GetPayoutCommand } from "./bot/commands/get-payouts.command";
import { TelegramService } from "./bot/telegram/telegram.service";
import { TelegramChatAdapter } from "./bot/telegram/telegram-chat-adapter";
import { db } from "./db";
import { AIService } from "./modules/ai/ai.service";
import { OpenAIAdapter } from "./modules/ai/open-ai-adapter";
import { ExpenseService } from "./modules/expense/expense.service";
import { SqliteExpenseRepository } from "./modules/expense/expense.sqlite.repository";
import { ExpensePresenter } from "./modules/expense/expense-presenter";
import { GroupService } from "./modules/group/group.service";
import { SqliteGroupRepository } from "./modules/group/group.sqlite.repository";
import { UserService } from "./modules/user/user.service";
import { SqliteUserRepository } from "./modules/user/user.sqlite.repository";
import { UserPresenter } from "./modules/user/user-presenter";
import { WebhookService } from "./webhook/webhook.service";

const openaiApiKey = process.env.OPENAI_API_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramWebhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

if (!openaiApiKey || !telegramBotToken || !telegramWebhookUrl) {
	throw new Error("ENV variable missing");
}

const openaiClient = new OpenAI({ apiKey: openaiApiKey });

// Adapters
const telegramAdapter = new TelegramChatAdapter({
	botToken: telegramBotToken,
	webhookUrl: telegramWebhookUrl,
});
const openaiAdapter = new OpenAIAdapter(openaiClient);

// Repositories
const userRepository = new SqliteUserRepository(db);
const expenseRepository = new SqliteExpenseRepository(db);
const groupRepository = new SqliteGroupRepository(db);

// General Services
const groupService = new GroupService(groupRepository);
const expenseService = new ExpenseService(expenseRepository, groupService);
const chatService = new ChatService(telegramAdapter);
const userService = new UserService(userRepository, groupService);

// Chat Services
const userPresenter = new UserPresenter(userService, groupService);
const expensePresenter = new ExpensePresenter(expenseService);

const commandRegistry = new CommandRegistry()
	.register(new ClosegroupCommand(groupService))
	.register(new GetPayoutCommand(expensePresenter))
	.register(new GetExpensesCommand(expensePresenter));

const aiService = new AIService(openaiAdapter, userPresenter, expensePresenter);

const telegramService = new TelegramService(telegramAdapter);
const webhookService = new WebhookService(
	aiService,
	commandRegistry,
	chatService,
);

export const deps = {
	aiService,
	chatService,
	commandRegistry,
	expensePresenter,
	expenseRepository,
	expenseService,
	groupRepository,
	groupService,
	openaiAdapter,
	telegramAdapter,
	telegramService,
	userPresenter,
	userRepository,
	userService,
	webhookService,
} as const;

export type Deps = typeof deps;
