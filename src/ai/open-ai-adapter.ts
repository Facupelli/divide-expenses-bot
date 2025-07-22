import { OpenAI } from "openai";
import { AIError, AIProvider } from "./types";
import fs from "fs/promises";
import { ResponseInput, Tool } from "openai/resources/responses/responses.js";

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
    name: "get_payments",
    description:
      "Obtiene la lista de transacciones que se deben realizar para ajustar las cuentas entre todos los participantes del grupo. Ajuste de cuentas.",
    parameters: null,
    strict: null,
  },
  {
    type: "function",
    name: "add_users",
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
      "Registra un nuevo gasto en la base de datos cuando se tiene toda la información requerida.",
    parameters: {
      type: "object",
      properties: {
        payer: {
          type: "string",
          description: "Nombre de la persona que pagó el gasto",
        },
        amount: {
          type: "number",
          description: "Monto del gasto en números (sin símbolos de moneda)",
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
    strict: true,
  },
];

export class OpenAIAdapter implements AIProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async createResponse(
    inputArray: ResponseInput,
    augmentedInstructions?: string
  ): Promise<OpenAI.Responses.Response> {
    try {
      let instructions = await fs.readFile("./src/prompt.txt", "utf-8");

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
    } catch (err) {
      throw new AIError(`OpenAI failed: ${err}`);
    }
  }
}
