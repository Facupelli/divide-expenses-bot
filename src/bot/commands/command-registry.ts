import type { ICommand } from "./types";

export class CommandRegistry {
	private readonly map = new Map<string, ICommand>();

	get(input: string): ICommand | undefined {
		const commandToken = input.trim().split(/\s+/, 1)[0];
		const commandName = commandToken.slice(1).split("@", 1)[0].toLowerCase();

		return this.map.get(commandName);
	}

	register(cmd: ICommand): this {
		this.map.set(cmd.name, cmd);
		return this;
	}
}
