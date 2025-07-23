import fs from "fs/promises";
import type { OpenAI } from "openai";
import type {
	ResponseInput,
	Tool,
} from "openai/resources/responses/responses.js";
import { AIError, type AIProvider } from "./types";

const tools: Tool[] = [
	{
		type: "function",
		name: "get_expenses",
		description:
			"Obtiene la lista de todos los pagos del grupo de participantes.",
		parameters: null,
		strict: null,
	},
	{
		type: "function",
		name: "get_payouts",
		description:
			"Obtiene la lista de transacciones que se deben realizar para ajustar las cuentas entre todos los participantes del grupo. Ajuste de cuentas.",
		parameters: null,
		strict: null,
	},
	{
		type: "function",
		name: "add_participants",
		description:
			"Agrega al grupo la lista completa de personas que participarán en los gastos.",
		parameters: {
			type: "object",
			properties: {
				names: {
					type: "array",
					items: { type: "string" },
					description: "Lista de nombres de las personas del grupo",
				},
			},
			required: ["names"],
			additionalProperties: false,
		},
		strict: true,
	},
	{
		type: "function",
		name: "add_expense",
		description:
			"Registra uno o múltiples gastos en la base de datos cuando se tiene toda la información requerida.",
		parameters: {
			type: "object",
			properties: {
				expenses: {
					type: "array",
					description: "Lista de gastos a registrar",
					items: {
						type: "object",
						properties: {
							payer: {
								type: "string",
								description: "Nombre de la persona que pagó el gasto",
							},
							amount: {
								type: "number",
								description:
									"Monto del gasto en números (sin símbolos de moneda)",
							},
							description: {
								type: "string",
								description:
									"Concepto o descripción del gasto (ej: cena, gasolina, snacks)",
							},
							splitBetween: {
								type: "array",
								items: {
									type: "string",
								},
								description:
									"Lista de nombres de las personas entre las que se debe dividir un gasto",
							},
						},
						required: ["payer", "amount", "description", "splitBetween"],
						additionalProperties: false,
					},
					minItems: 1,
				},
			},
			required: ["expenses"],
			additionalProperties: false,
		},
		strict: true,
	},
];

export class OpenAIAdapter implements AIProvider {
	constructor(private readonly openai: OpenAI) {}

	async createResponse(
		inputArray: ResponseInput,
		augmentedInstructions?: string,
	): Promise<OpenAI.Responses.Response> {
		try {
			let instructions = await fs.readFile(
				"./src/modules/ai/prompt.txt",
				"utf-8",
			);

			if (augmentedInstructions != null) {
				instructions = `${instructions}\n\n${augmentedInstructions}`;
			}

			const response = await this.openai.responses.create({
				model: "gpt-4.1-nano-2025-04-14",
				instructions,
				tools,
				input: inputArray,
			});

			return response;
		} catch (error) {
			console.error("[OPENAI CREATE_RESPONSE] error:", { error });
			throw new AIError(`OpenAI failed: ${error}`);
		}
	}
}
