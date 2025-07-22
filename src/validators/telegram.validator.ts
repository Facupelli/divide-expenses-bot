import { z } from "zod";

export const setCommandsSchema = z.object({
	commands: z.array(
		z.object({
			command: z.string(),
			description: z.string(),
		}),
	),
	scope: z.string().optional(),
});

export type SetCommandsBody = z.infer<typeof setCommandsSchema>;

export const setBotNameSchema = z.object({
	name: z.string(),
});

export type SetBotNameBody = z.infer<typeof setBotNameSchema>;
