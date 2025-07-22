import { insertExpenseSchema, NewExpense } from "../db/schema";
import { UserService } from "../user/user.service";
import { SqliteExpenseRepository } from "./expense.sqlite.repository";

export class ChatExpenseService {
  constructor(
    private expenseRepository: SqliteExpenseRepository,
    private userService: UserService
  ) {}

  async getAllExpenses() {
    try {
      const expensesList = await this.expenseRepository.getAll();

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

  async addExpense(newExpense: NewExpense, splitBetween: string[]) {
    const isUserValid = await this.userService.checkUserIsInParticipants(
      newExpense.payer
    );

    if (!isUserValid) {
      return {
        success: false,
        message:
          "❌ La persona que pagó no está presente entre los participantes del grupo.",
      };
    }

    try {
      const validatedExpense = insertExpenseSchema.parse(newExpense);

      await this.expenseRepository.save(validatedExpense, splitBetween);

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
}
