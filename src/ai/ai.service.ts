import { ResponseInput } from "openai/resources/responses/responses.js";
import { AIProvider } from "./types";
import { ChatUserService } from "../user/chat-user.service";
import { ChatExpenseService } from "../expense/chat-expense.service";
import { db } from "../db";
import { expenseParticipants, expenses, users } from "../db/schema";
import { eq } from "drizzle-orm";

async function get_payments() {
  try {
    const expensesList = await db.select().from(expenses);
    const usersList = await db.select().from(users);

    // STEP 1 - get users balances
    const usersBalance: Record<string, number> = {};

    usersList.forEach((user) => (usersBalance[user.name] = 0));

    for (const expense of expensesList) {
      const splitBetween = await db
        .select({ userName: expenseParticipants.userName })
        .from(expenseParticipants)
        .where(eq(expenseParticipants.expenseId, expense.id));

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

      const payerAmount = Math.min(creditor.balance, Math.abs(debtor.balance));

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

const history: Record<number, ResponseInput> = {};

function push(chatId: number, role: "user" | "assistant", text: string) {
  if (!history[chatId]) {
    history[chatId] = [];
  }

  history[chatId].push({ role, content: text });
  // keep only the last 4 messages to stay small
  if (history[chatId].length > 10) {
    history[chatId].shift();
  }
}

export class AIService {
  constructor(
    private ai: AIProvider,
    private chatUserService: ChatUserService,
    private chatExpenseService: ChatExpenseService
  ) {}

  async createResponse(chatId: number, input: string) {
    let augmentedInstructions;
    const { message } = await this.chatUserService.getAllUsers();

    if (message != null) {
      augmentedInstructions = `La lista actual de participantes es: "${message}"`;
    }

    push(chatId, "user", input);
    const inputArray: ResponseInput = history[chatId];

    console.dir({ history }, { depth: null });

    const response = await this.ai.createResponse(
      inputArray,
      augmentedInstructions
    );

    if (response.output_text) {
      push(chatId, "assistant", response.output_text);
    }

    console.log("TOOLCALL", response.output);

    for (const toolCall of response.output) {
      if (toolCall.type !== "function_call") {
        continue;
      }

      const name = toolCall.name;
      const args = JSON.parse(toolCall.arguments);

      const result = await this.callFunction(name, args);
      console.log("FUNCTION CALLING RESULT:", { result });

      if (result) {
        history[chatId] = [];
        return result.message;
      }
    }

    return response.output_text;
  }

  private async callFunction(name: string, args: any) {
    if (name === "get_payments") {
      return await get_payments();
    }
    if (name === "get_expenses") {
      return await this.chatExpenseService.getAllExpenses();
    }
    if (name === "add_users") {
      return await this.chatUserService.addUsers(args.names);
    }
    if (name === "add_expense") {
      return await this.chatExpenseService.addExpense(
        {
          payer: args.payer,
          amount: args.amount,
          description: args.description,
        },
        args.splitBetween
      );
    }
  }
}
