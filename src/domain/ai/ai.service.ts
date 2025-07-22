import type { ResponseInput } from "openai/resources/responses/responses.js";
import type { ChatExpenseService } from "../expense/chat-expense.service";
import type { ChatUserService } from "../user/chat-user.service";
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
		private chatUserService: ChatUserService,
		private chatExpenseService: ChatExpenseService,
	) {}

	async createResponse(chatId: number, input: string) {
		let augmentedInstructions: string | undefined;
		const { message } = await this.chatUserService.getUsers(String(chatId));

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
		}

		console.log("TOOLCALL", response.output);

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
				return result.message;
			}
		}

		return response.output_text;
	}

	private async callFunction(name: string, args: any, chatId: string) {
		if (name === "get_payments") {
			return await this.chatExpenseService.getPayouts(chatId);
		}
		if (name === "get_expenses") {
			return await this.chatExpenseService.getAllExpenses(chatId);
		}
		if (name === "add_users") {
			return await this.chatUserService.addUsers(args.names, chatId);
		}
		if (name === "add_expense") {
			return await this.chatExpenseService.addExpense(
				{
					payer: args.payer,
					amount: args.amount,
					description: args.description,
				},
				args.splitBetween,
				chatId,
			);
		}
	}
}
