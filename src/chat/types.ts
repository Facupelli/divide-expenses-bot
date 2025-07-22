import { Request } from "express";

export interface ChatProvider {
  sendMessage(chatId: number, text: string): Promise<void>;
  setWebhook(url: string): Promise<void>;
  getWebhookInfo(): Promise<void>;
  validateWebhook(req: Request): Promise<boolean>;

  // todo: handle telegram specific features
  setCommands(
    commands: { command: string; description: string }[],
    scope?: string
  ): Promise<void>;
}

export class ChatError extends Error {}
