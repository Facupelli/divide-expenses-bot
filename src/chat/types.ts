import { Request } from "express";

export interface ChatProvider {
  sendMessage(chatId: string, text: string): Promise<void>;
  setWebhook(url: string): Promise<void>;
  getWebhookInfo(): Promise<void>;
  validateWebhook(req: Request): Promise<boolean>;
}

export class ChatError extends Error {}
