import type { User } from "../../db/schema";

export interface UserRepository {
	saveMultiple(userNames: { name: string }[]): Promise<void>;
	getAll(): Promise<User[]>;
}

export class DatabaseError extends Error {
	readonly code: string;

	constructor(message: string, code = "DB_ERROR") {
		super(message);
		this.name = "DatabaseError";
		this.code = code;
	}
}
