import type { ResponseInput } from "openai/resources/responses/responses.js";
import type { ExpensePresenter } from "../expense/expense-presenter";
import type { UserPresenter } from "../user/user-presenter";
import { expenseArguments, participantArguments } from "./tool-arguments";
import type { AIProvider } from "./types";

const invalidToolArgumentsMessage =
	"❌ Datos inválidos. Por favor, aclara tu mensaje.";

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
		idempotencyKey: string,
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

		console.log("TOOLCALL", response.output);

		const toolMessages: string[] = [];

		for (const toolCall of response.output) {
			if (toolCall.type !== "function_call") {
				continue;
			}

			let args: unknown;
			try {
				args = JSON.parse(toolCall.arguments);
			} catch (error) {
				if (!(error instanceof SyntaxError)) throw error;
				toolMessages.push(invalidToolArgumentsMessage);
				continue;
			}
			const result = await this.callFunction(
				toolCall.name,
				args,
				String(chatId),
				idempotencyKey,
			);
			console.log("FUNCTION CALLING RESULT:", { result });

			if (result) {
				if (!("validationFailed" in result)) {
					history[chatId] = [];
				}
				toolMessages.push(result.message);
			}
		}

		if (toolMessages.length > 0) {
			return toolMessages;
		}

		if (response.output_text) {
			push(chatId, "assistant", response.output_text);
			return response.output_text;
		}
	}

	private async callFunction(
		name: string,
		args: unknown,
		chatId: string,
		idempotencyKey: string,
	) {
		switch (name) {
			case "get_payouts":
				return await this.expensePresenter.getPayouts(chatId);
			case "get_expenses":
				return await this.expensePresenter.getAllExpenses(chatId);
			case "add_participants": {
				const validated = participantArguments.safeParse(args);
				if (!validated.success) {
					return {
						message: invalidToolArgumentsMessage,
						validationFailed: true,
					};
				}
				return await this.userPresenter.addUsers(validated.data.names, chatId);
			}
			case "add_expense": {
				const validated = expenseArguments.safeParse(args);
				if (!validated.success) {
					return {
						message: invalidToolArgumentsMessage,
						validationFailed: true,
					};
				}
				return await this.expensePresenter.addExpenses(
					validated.data.expenses,
					chatId,
					`${idempotencyKey}:${name}`,
				);
			}
		}
	}
}
