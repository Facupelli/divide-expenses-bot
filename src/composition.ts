import { ChatService } from "./chat/chat.service";
import { ClosegroupCommand } from "./chat/commands/close-group.command";
import { CommandRegistry } from "./chat/commands/command-registry";
import { GetExpensesCommand } from "./chat/commands/get-expenses.command copy";
import { GetPayoutCommand } from "./chat/commands/get-payouts.command";
import { TelegramService } from "./chat/telegram/telegram.service";
import { TelegramChatAdapter } from "./chat/telegram/telegram-chat-adapter";
import { AIService } from "./domain/ai/ai.service";
import { OpenAIAdapter } from "./domain/ai/open-ai-adapter";
import { ChatExpenseService } from "./domain/expense/chat-expense.service";
import { ExpenseService } from "./domain/expense/expense.service";
import { SqliteExpenseRepository } from "./domain/expense/expense.sqlite.repository";
import { GroupService } from "./domain/group/group.service";
import { SqliteGroupRepository } from "./domain/group/group.sqlite.repository";
import { ChatUserService } from "./domain/user/chat-user.service";
import { UserService } from "./domain/user/user.service";
import { SqliteUserRepository } from "./domain/user/user.sqlite.repository";

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

const commandRegistry = new CommandRegistry()
	.register(new ClosegroupCommand(groupService))
	.register(new GetPayoutCommand(chatExpenseService))
	.register(new GetExpensesCommand(chatExpenseService));

const telegramService = new TelegramService(telegramAdapter);

const aiService = new AIService(
	openaiAdapter,
	chatUserService,
	chatExpenseService,
);

export const deps = {
	telegramAdapter,
	openaiAdapter,
	userRepository,
	expenseRepository,
	groupRepository,
	expenseService,
	chatService,
	groupService,
	userService,
	chatUserService,
	chatExpenseService,
	commandRegistry,
	aiService,
	telegramService,
} as const;

export type Deps = typeof deps;
