import { z } from "zod";
import { parseAmountToCents } from "../expense/money";
import { normalizeParticipantName } from "../participant-name";

export const expenseArguments = z
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
								const normalized = names.map(normalizeParticipantName);
								return new Set(normalized).size === names.length;
							}),
					})
					.strict(),
			)
			.min(1),
	})
	.strict();

export const participantArguments = z
	.object({ names: z.array(z.string()) })
	.strict();
