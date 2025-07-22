import { ICommand } from "./types";

export class CommandRegistry {
  private readonly map = new Map<string, ICommand>();

  get(name: string): ICommand | undefined {
    return this.map.get(name.slice(1));
  }

  register(cmd: ICommand): this {
    this.map.set(cmd.name, cmd);
    return this;
  }
}
