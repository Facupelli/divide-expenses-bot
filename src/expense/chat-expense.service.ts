import { NewExpense } from "../db/schema";
import { GroupService } from "../group/group.service";
import { ExpenseService } from "./expense.service";

export class ChatExpenseService {
  constructor(
    private expenseService: ExpenseService,
    private groupService: GroupService
  ) {}

  async getAllExpenses(chatId: string) {
    try {
      const expensesList = await this.expenseService.getAll(chatId);

      return {
        success: true,
        message: expensesList
          .map(
            (expense) =>
              `- ${expense.payer} pagó ${expense.amount} por ${expense.description}\n`
          )
          .join(""),
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
    chatId: string
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
      chatId
    );

    if (!isUserValid) {
      return {
        success: false,
        message:
          "❌ La persona que pagó no está presente entre los participantes del grupo.",
      };
    }

    try {
      await this.expenseService.save(newExpense, splitBetween, groupId);

      const message = `✅ Gasto registrado:\n
      - ${newExpense.payer} pagó ${newExpense.amount} por ${newExpense.description}
      `;

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

      usersList.forEach((user) => (usersBalance[user] = 0));

      for (const expense of expensesList) {
        const splitBetween = await this.expenseService.getSplitBetween(
          expense.id
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
          Math.abs(debtor.balance)
        );

        transactions.push(
          `${debtor.user} debe ${payerAmount} a ${creditor.user}`
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

      return {
        success: true,
        message: transactions.map((t) => `- ${t}\n`).join(""),
      };
    } catch (error) {
      console.error("GET_PAYMENTS ERROR:", { error });
      return { success: false, message: "Hubo un error" };
    }
  }
}
