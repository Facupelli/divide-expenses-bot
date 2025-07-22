import { ChatExpenseService } from "../../expense/chat-expense.service";
import { TelegramMessage } from "../types/telegram.type";
import { ICommand, ICommandResponse } from "./types";

export class GetPayoutCommand implements ICommand {
  constructor(private chatExpenseService: ChatExpenseService) {}

  readonly name = "ajuste_cuentas";
  async execute(
    chatId: number,
    msg: TelegramMessage
  ): Promise<ICommandResponse> {
    console.log(
      `COMMAND [ajuste_cuentas] triggered by ${msg.from?.first_name}`
    );

    return await this.chatExpenseService.getPayouts(String(chatId));
  }
}
