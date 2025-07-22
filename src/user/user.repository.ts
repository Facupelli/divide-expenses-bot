import { User } from "../db/schema";

export interface UserRepository {
  save(user: User): Promise<void>;
  saveMultiple(userNames: { name: string }[]): Promise<void>;
  findById(id: string): Promise<User | null>;
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
