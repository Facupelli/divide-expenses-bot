import type { ResponseInput } from "openai/resources/responses/responses.js";
import type { ExpensePresenter } from "../expense/expense-presenter";
import type { UserPresenter } from "../user/user-presenter";
import type { AIProvider } from "./types";

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
		private userPresenter: UserPresenter,
		private expensePresenter: ExpensePresenter,
	) {}

	async createResponse(
		chatId: number,
		input: string,
	): Promise<string | string[] | undefined> {
		let augmentedInstructions: string | undefined;
		const { message } = await this.userPresenter.getUsers(String(chatId));

		if (message != null && message.length > 0) {
			augmentedInstructions = `La lista actual de participantes es: "${message}"`;
		}

		push(chatId, "user", input);
		const inputArray: ResponseInput = history[chatId];

		// console.dir({ history }, { depth: null });

		const response = await this.ai.createResponse(
			inputArray,
			augmentedInstructions,
		);

		if (response.output_text) {
			push(chatId, "assistant", response.output_text);
			return response.output_text;
		}

		console.log("TOOLCALL", response.output);

		const toolMessages: string[] = [];

		for (const toolCall of response.output) {
			if (toolCall.type !== "function_call") {
				continue;
			}

			const name = toolCall.name;
			const args = JSON.parse(toolCall.arguments);

			const result = await this.callFunction(name, args, String(chatId));
			console.log("FUNCTION CALLING RESULT:", { result });

			if (result) {
				history[chatId] = [];
				toolMessages.push(result.message);
			}
		}

		if (toolMessages.length > 0) {
			return toolMessages;
		}
	}

	private async callFunction(name: string, args: any, chatId: string) {
		if (name === "get_payouts") {
			return await this.expensePresenter.getPayouts(chatId);
		}
		if (name === "get_expenses") {
			return await this.expensePresenter.getAllExpenses(chatId);
		}
		if (name === "add_participants") {
			return await this.userPresenter.addUsers(args.names, chatId);
		}
		if (name === "add_expense") {
			return await this.expensePresenter.addExpenses(args.expenses, chatId);
		}
	}
}
