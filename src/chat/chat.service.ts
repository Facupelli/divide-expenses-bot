import { Request } from "express";
import { ChatProvider } from "./types";

export class ChatService {
  constructor(private chat: ChatProvider) {}

  async validateWebhook(req: Request) {
    return this.chat.validateWebhook(req);
  }

  async sendMessage(chatId: string, text: string) {
    return await this.chat.sendMessage(chatId, text);
  }
}
