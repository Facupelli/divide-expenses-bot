import type { ResponseInput } from "openai/resources/responses/responses.js";
import { z } from "zod";
import type { ExpensePresenter } from "../expense/expense-presenter";
import { parseAmountToCents } from "../expense/money";
import type { UserPresenter } from "../user/user-presenter";
import type { AIProvider } from "./types";

const expenseArguments = z
	.object({
		expenses: z
			.array(
				z
					.object({
						payer: z.string().min(1),
						amount: z.string().refine((amount) => {
							try {
								parseAmountToCents(amount);
								return true;
							} catch {
								return false;
							}
						}),
						description: z.string().min(1),
						split: z
							.object({
								mode: z.enum(["all", "include", "exclude"]),
								names: z.array(z.string().min(1)),
							})
							.strict()
							.refine(({ mode, names }) =>
								mode === "all" ? names.length === 0 : names.length > 0,
							)
							.refine(({ names }) => {
								const normalized = names.map((name) =>
									name
										.normalize("NFD")
										.replace(/\p{Diacritic}/gu, "")
										.toLocaleLowerCase(),
								);
								return new Set(normalized).size === names.length;
							}),
					})
					.strict(),
			)
			.min(1),
	})
	.strict();

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
			let args: unknown;
			try {
				args = JSON.parse(toolCall.arguments);
			} catch {
				if (name !== "add_expense") throw new Error("Invalid tool arguments");
				toolMessages.push(
					"❌ Datos del gasto inválidos. Por favor, aclara el gasto.",
				);
				continue;
			}
			let result: { message: string } | undefined;
			if (name === "add_expense") {
				const validated = expenseArguments.safeParse(args);
				if (!validated.success) {
					toolMessages.push(
						"❌ Datos del gasto inválidos. Por favor, aclara el gasto.",
					);
					continue;
				}
				result = await this.expensePresenter.addExpenses(
					validated.data.expenses,
					String(chatId),
					`${idempotencyKey}:${name}`,
				);
			} else {
				result = await this.callFunction(name, args, String(chatId));
			}
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

	private async callFunction(name: string, args: unknown, chatId: string) {
		if (name === "get_payouts") {
			return await this.expensePresenter.getPayouts(chatId);
		}
		if (name === "get_expenses") {
			return await this.expensePresenter.getAllExpenses(chatId);
		}
		if (name === "add_participants") {
			return await this.userPresenter.addUsers(
				z
					.object({ names: z.array(z.string()) })
					.strict()
					.parse(args).names,
				chatId,
			);
		}
	}
}
