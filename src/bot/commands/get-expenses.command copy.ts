import type { ExpensePresenter } from "../../modules/expense/expense-presenter";
import type { TelegramMessage } from "../types/telegram.type";
import type { ICommand, ICommandResponse } from "./types";

export class GetExpensesCommand implements ICommand {
	constructor(private expensePresenter: ExpensePresenter) {}

	readonly name = "ver_gastos";
	async execute(
		chatId: number,
		msg: TelegramMessage,
	): Promise<ICommandResponse> {
		console.log(`COMMAND [ver_gastos] triggered by ${msg.from?.first_name}`);

		return await this.expensePresenter.getAllExpenses(String(chatId));
	}
}
