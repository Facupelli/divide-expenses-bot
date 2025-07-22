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

const openaiApiKey = process.env.OPENAI_API_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramWebhook = process.env.TELEGRAM_WEBHOOK_URL;

if (!openaiApiKey || !telegramToken || !telegramWebhook) {
  throw new Error("ENV variable missing");
}

const telegramAdapter = new TelegramChatAdapter(telegramToken, telegramWebhook);
const chatService = new ChatService(telegramAdapter);

const userRepository = new SqliteUserRepository();
const expenseRepository = new SqliteExpenseRepository();

const openaiAdapter = new OpenAIAdapter(openaiApiKey);

const userService = new UserService(userRepository);
const chatUserService = new ChatUserService(userRepository);
const chatExpenseService = new ChatExpenseService(
  expenseRepository,
  userService
);

const aiService = new AIService(
  openaiAdapter,
  chatUserService,
  chatExpenseService
);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/webhook-info", async (req, res, next) => {
  return res.sendStatus(200);
});

app.post("/webhook", async (req, res, next) => {
  const body = req.body;

  const isValidWebhook = chatService.validateWebhook(req);

  if (!isValidWebhook) {
    return res.sendStatus(200);
  }

  const text = body.message.text;
  const chatId = body.message.chat.id;
  const response = await aiService.createResponse(chatId, text);
  if (response != null) {
    await chatService.sendMessage(chatId, response);
  }

  return res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
