import "dotenv/config";
import express from "express";
import cors from "cors";
import { TelegramChatAdapter } from "./chat/telegram-chat-adapter";
import { ChatService } from "./chat/chat.service";
import { OpenAIAdapter } from "./ai/open-ai-adapter";
import { AIService } from "./ai/ai.service";
import { ChatUserService } from "./user/chat-user.service";
import { ChatExpenseService } from "./expense/chat-expense.service";
import { SqliteUserRepository } from "./user/user.sqlite.repository";
import { SqliteExpenseRepository } from "./expense/expense.sqlite.repository";
import { UserService } from "./user/user.service";
import { CommandRegistry } from "./chat/commands/command-registry";
import { ClosegroupCommand } from "./chat/commands/close-group.command";
import { TelegramMessage, TelegramUpdate } from "./chat/types/telegram.type";
import { GroupService } from "./group/group.service";
import { SqliteGroupRepository } from "./group/group.sqlite.repository";
import { ExpenseService } from "./expense/expense.service";
import { GetPayoutCommand } from "./chat/commands/get-payouts.command";
import { GetExpensesCommand } from "./chat/commands/get-expenses.command copy";

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

const aiService = new AIService(
  openaiAdapter,
  chatUserService,
  chatExpenseService,
  groupService
);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/webhook-info", async (req, res, next) => {
  await chatService.getWebhookInfo();
  return res.sendStatus(200);
});

app.post("/commands", async (req, res, next) => {
  const body = req.body;

  await chatService.setCommands(body.commands, body.scope);
  return res.sendStatus(200);
});

app.post("/webhook", async (req, res, next) => {
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
