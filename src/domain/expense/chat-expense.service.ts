import type { GroupService } from "../group/group.service";
import type { ExpenseService } from "./expense.service";
import { formatAmount } from "./price.helper";

export class ChatExpenseService {
	constructor(
		private expenseService: ExpenseService,
		private groupService: GroupService,
	) {}

	async getAllExpenses(chatId: string) {
		try {
			const expensesList = await this.expenseService.getAll(chatId);

			const message = [
				"📒 Lista de gastos del grupo",
				"",
				expensesList
					.map((expense) => {
						const date = expense.createdAt.toISOString();
						return `- ${expense.payer} pagó 💰 ${formatAmount(expense.amount)} por ${expense.description} ${date}`;
					})
					.join("\n"),
			].join("\n");

			return {
				success: true,
				message,
			};
		} catch (_) {
			return {
				success: false,
				message: "Hubo un error obteniendo los gastos.",
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
		const groupId = await this.groupService.getActive(chatId);

		if (groupId == null) {
			return {
				success: false,
				message:
					"❌ No hay ningún grupo activo actualmente. Crea uno nuevo para registrar gastos!",
			};
		}

		// Validate all payers are in the group
		const invalidPayers = [];
		for (const expense of expenses) {
			const isUserValid = await this.groupService.checkUserIsInGroup(
				expense.payer,
				chatId,
			);
			if (!isUserValid) {
				invalidPayers.push(expense.payer);
			}
		}

		if (invalidPayers.length > 0) {
			const payerList = invalidPayers.join(", ");
			return {
				success: false,
				message: `❌ Las siguientes personas no están en el grupo: ${payerList}`,
			};
		}

		try {
			// Process all expenses
			const results = [];
			for (const expense of expenses) {
				const newExpense = {
					payer: expense.payer,
					amount: expense.amount,
					description: expense.description,
				};

				const { createdAt } = await this.expenseService.save(
					newExpense,
					expense.splitBetween,
					groupId,
				);

				results.push({
					...newExpense,
					splitBetween: expense.splitBetween,
					createdAt,
				});
			}

			if (results.length === 1) {
				const expense = results[0];
				const message = [
					"✅ Gasto registrado",
					`👤 ${expense.payer} pagó 💰 ${formatAmount(expense.amount)}`,
					`📝 por: ${expense.description}`,
					`🕒 ${expense.createdAt.toISOString()}`,
				].join("\n");

				return { success: true, message };
			}

			const header = `✅ ${results.length} gastos registrados:\n`;
			const expenseLines = results.map(
				(expense, index) =>
					`${index + 1}. ${expense.payer} - 💰 ${formatAmount(expense.amount)} - ${expense.description}`,
			);

			const message = header + expenseLines.join("\n");

			return { success: true, message };
		} catch (_) {
			return {
				success: false,
				message:
					"Hubo un error y el gasto no se registró. Prueba de nuevo por favor.",
			};
		}
	}

	async getPayouts(chatId: string) {
		try {
			const groupId = await this.groupService.getActive(chatId);

			if (groupId == null) {
				return {
					success: false,
					message:
						"❌ No hay ningún grupo activo actualmente. Crea uno nuevo y registra gastos!",
				};
			}

			const expensesList = await this.expenseService.getAll(chatId);
			const usersList = await this.groupService.getUsers(chatId);
			// STEP 1 - get users balances
			const usersBalance: Record<string, number> = {};

			usersList.forEach((user) => {
				usersBalance[user] = 0;
			});

			for (const expense of expensesList) {
				const splitBetween = await this.expenseService.getSplitBetween(
					expense.id,
				);

				const expenseUsers = splitBetween.map((user) => user.userName);
				const share = expense.amount / expenseUsers.length;

				usersBalance[expense.payer] += expense.amount;

				for (const user of expenseUsers) {
					usersBalance[user] -= share;
				}
			}

			// STEP 2 - match and settle
			const creditors = [];
			const debtors = [];

			for (const [user, balance] of Object.entries(usersBalance)) {
				if (balance > 0) {
					creditors.push({ user, balance });
				} else if (balance < 0) {
					debtors.push({ user, balance });
				}
			}

			const transactions: string[] = [];

			while (creditors.length > 0 && debtors.length > 0) {
				const creditor = creditors[0];
				const debtor = debtors[0];

				const payerAmount = Math.min(
					creditor.balance,
					Math.abs(debtor.balance),
				);

				transactions.push(
					`${debtor.user} debe ${formatAmount(payerAmount)} a ${creditor.user}`,
				);

				creditor.balance -= payerAmount;
				debtor.balance += payerAmount;

				if (creditor.balance === 0) {
					creditors.shift();
				}

				if (debtor.balance === 0) {
					debtors.shift();
				}
			}

			const message = [
				"💸 Ajuste de cuentas",
				"",
				transactions.map((t) => `- ${t}`).join("\n"),
			].join("\n");

			return {
				success: true,
				message,
			};
		} catch (error) {
			console.error("GET_PAYOUTS ERROR:", { error });
			return { success: false, message: "Hubo un error" };
		}
	}
}
