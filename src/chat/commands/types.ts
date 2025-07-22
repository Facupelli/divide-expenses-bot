import { TelegramMessage } from "../types/telegram.type";

export interface ICommandResponse {
  success: boolean;
  message: string;
}

export interface ICommand {
  readonly name: string;
  execute(
    chatId: number,
    msg: TelegramMessage
  ): ICommandResponse | Promise<ICommandResponse>;
}
