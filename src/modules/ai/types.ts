import type OpenAI from "openai";
import type { ResponseInput } from "openai/resources/responses/responses.js";

// TODO: handle createResponse params and response interface

export interface AIProvider {
	createResponse(
		inputArray: ResponseInput,
		augmentedInstructions?: string,
	): Promise<OpenAI.Responses.Response>;
}

export class AIError extends Error {}
