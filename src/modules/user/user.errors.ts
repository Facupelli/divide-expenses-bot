const USER_ERROR_TYPE = {
	ACTIVE_GROUP: "ACTIVE_GROUP",
} as const;

export type UserErrorType =
	(typeof USER_ERROR_TYPE)[keyof typeof USER_ERROR_TYPE];

export class ActiveGroupError extends Error {
	readonly tag = USER_ERROR_TYPE.ACTIVE_GROUP;
}
