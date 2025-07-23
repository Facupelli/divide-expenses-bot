export const EXPENSE_ERROR_TYPE = {
	NO_ACTIVE_GROUP: "NO_ACTIVE_GROUP",
	INVALID_PAYERS: "INVALID_PAYERS",
	CREATE_EXPENSE: "CREATE_EXPENSE",
} as const;

export type ExpenseErrorType =
	(typeof EXPENSE_ERROR_TYPE)[keyof typeof EXPENSE_ERROR_TYPE];

export class CreateExpenseError extends Error {}

export class NoActiveGroupError extends Error {
	readonly tag = EXPENSE_ERROR_TYPE.NO_ACTIVE_GROUP;
}

export class InvalidPayersError extends Error {
	readonly tag = EXPENSE_ERROR_TYPE.INVALID_PAYERS;
	constructor(public readonly payers: string[]) {
		super();
	}
}
