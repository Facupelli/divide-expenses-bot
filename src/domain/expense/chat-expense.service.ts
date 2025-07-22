import type { NewExpense } from "../../db/schema";
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
		} catch (error) {
			return {
				success: false,
				message: "Hubo un error obteniendo los gastos.",
			};
		}
	}

	async addExpense(
		newExpense: Omit<NewExpense, "groupId">,
		splitBetween: string[],
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

		const isUserValid = await this.groupService.checkUserIsInGroup(
			newExpense.payer,
			chatId,
		);

		if (!isUserValid) {
			return {
				success: false,
				message:
					"❌ La persona que pagó no está presente entre los participantes del grupo.",
			};
		}

		try {
			const { createdAt } = await this.expenseService.save(
				newExpense,
				splitBetween,
				groupId,
			);

			const message = [
				"✅ Gasto registrado",
				`👤 ${newExpense.payer} pagó 💰 ${formatAmount(newExpense.amount)}`,
				`📝 por: ${newExpense.description}`,
				`🕒 ${createdAt.toISOString()}`,
			].join("\n");

			return { success: true, message };
		} catch (error) {
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
			console.error("GET_PAYMENTS ERROR:", { error });
			return { success: false, message: "Hubo un error" };
		}
	}
}
