import { insertExpenseSchema, NewExpense } from "../db/schema";
import { GroupService } from "../group/group.service";
import { UserService } from "../user/user.service";
import { SqliteExpenseRepository } from "./expense.sqlite.repository";

export class ChatExpenseService {
  constructor(
    private expenseRepository: SqliteExpenseRepository,
    private userService: UserService,
    private groupService: GroupService
  ) {}

  async getAllExpenses(chatId: string) {
    try {
      const expensesList = await this.expenseRepository.getAll(chatId);

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

    const isUserValid = await this.userService.checkUserIsInParticipants(
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
      const validatedExpense = insertExpenseSchema.parse({
        ...newExpense,
        groupId,
      });

      await this.expenseRepository.save(
        validatedExpense,
        splitBetween,
        groupId
      );

      const message = `✅ Gasto registrado:\n
      - ${validatedExpense.payer} pagó ${validatedExpense.amount} por ${validatedExpense.description}
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

  async getPayments(chatId: string) {
    try {
      const groupId = await this.groupService.getActive(chatId);

      if (groupId == null) {
        return {
          success: false,
          message:
            "❌ No hay ningún grupo activo actualmente. Crea uno nuevo y registra gastos!",
        };
      }

      const expensesList = await this.expenseRepository.getAll(chatId);
      const usersList = await this.groupService.getUsers(chatId);
      // STEP 1 - get users balances
      const usersBalance: Record<string, number> = {};

      usersList.forEach((user) => (usersBalance[user] = 0));

      for (const expense of expensesList) {
        const splitBetween = await this.expenseRepository.getSplitBetween(
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
