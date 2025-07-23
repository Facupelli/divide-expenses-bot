import type { ChatExpenseService } from "../../modules/expense/expense-presenter";
import type { TelegramMessage } from "../types/telegram.type";
import type { ICommand, ICommandResponse } from "./types";

export class GetExpensesCommand implements ICommand {
	constructor(private chatExpenseService: ChatExpenseService) {}

	readonly name = "ver_gastos";
	async execute(
		chatId: number,
		msg: TelegramMessage,
	): Promise<ICommandResponse> {
		console.log(`COMMAND [ver_gastos] triggered by ${msg.from?.first_name}`);

		return await this.chatExpenseService.getAllExpenses(String(chatId));
	}
}
