import type { ChatExpenseService } from "../../modules/expense/expense-presenter";
import type { TelegramMessage } from "../types/telegram.type";
import type { ICommand, ICommandResponse } from "./types";

export class GetPayoutCommand implements ICommand {
	constructor(private chatExpenseService: ChatExpenseService) {}

	readonly name = "ajuste_cuentas";
	async execute(
		chatId: number,
		msg: TelegramMessage,
	): Promise<ICommandResponse> {
		console.log(
			`COMMAND [ajuste_cuentas] triggered by ${msg.from?.first_name}`,
		);

		return await this.chatExpenseService.getPayouts(String(chatId));
	}
}
