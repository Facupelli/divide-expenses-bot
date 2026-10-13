const USER_ERROR_TYPE = {
	ACTIVE_GROUP: "ACTIVE_GROUP",
} as const;

export type UserErrorType =
	(typeof USER_ERROR_TYPE)[keyof typeof USER_ERROR_TYPE];

export class ActiveGroupError extends Error {
	readonly tag = USER_ERROR_TYPE.ACTIVE_GROUP;
}

export class EmptyParticipantListError extends Error {}

export class EmptyParticipantNameError extends Error {}

export class DuplicateParticipantNamesError extends Error {
	constructor(public readonly conflicts: string[][]) {
		super();
	}
}
