import {
	createErrorExpenseMessage,
	createListExpensesMessage,
	createSuccessExpenseMessage,
} from "../../bot/messages/factories/expense.factory";
import { formatAmount } from "./expense.helpers";
import type { ExpenseService } from "./expense.service";

export class ExpensePresenter {
	constructor(private expenseService: ExpenseService) {}

	async getAllExpenses(chatId: string) {
		try {
			const expensesList = await this.expenseService.getAll(chatId);
			const message = createListExpensesMessage(expensesList);

			return {
				success: true,
				message,
			};
		} catch (error) {
			return {
				success: false,
				message: createErrorExpenseMessage(error),
			};
		}
	}

	async addExpenses(
		expenses: Array<{
			payer: string;
			amount: number;
			description: string;
			splitBetween: string[];
		}>,
		chatId: string,
	) {
		try {
			const results = await this.expenseService.saveMultiple(expenses, chatId);
			const message = createSuccessExpenseMessage(results);
			return { success: true, message };
		} catch (error) {
			return {
				success: false,
				message: createErrorExpenseMessage(error),
			};
		}
	}

	async getPayouts(chatId: string) {
		try {
			const { transactions, total, eachShare } =
				await this.expenseService.getPayouts(chatId);

			const transactionMessages = transactions.map(
				({ debtor, payerAmount, creditor }) =>
					`${debtor.user} debe ${formatAmount(payerAmount)} a ${creditor.user}`,
			);

			const message = [
				"💸 Ajuste de cuentas",
				"",
				`Total: ${formatAmount(total)}`,
				`Por persona: ${formatAmount(eachShare)}`,
				"",
				transactionMessages.map((t) => `- ${t}`).join("\n"),
			].join("\n");

			return {
				success: true,
				message,
			};
		} catch (error) {
			return {
				success: false,
				message: createErrorExpenseMessage(error),
			};
		}
	}
}
