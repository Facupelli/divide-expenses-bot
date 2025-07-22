import { GroupService } from "../../group/group.service";
import { TelegramMessage } from "../types/telegram.type";
import { ICommand, ICommandResponse } from "./types";

export class ClosegroupCommand implements ICommand {
  constructor(private groupService: GroupService) {}

  readonly name = "cerrar_grupo";
  async execute(
    chatId: number,
    msg: TelegramMessage
  ): Promise<ICommandResponse> {
    console.log(`COMMAND [cerrar_grupo] triggered by ${msg.from?.first_name}`);
    try {
      await this.groupService.close(String(chatId));
      return {
        success: true,
        message:
          "✅ Se cerró el grupo activo. Puedes volver a comenzar creando uno nuevo!",
      };
    } catch (error) {
      return {
        success: false,
        message: "Hubo un error, no se pudo cerrar el grupo",
      };
    }
  }
}
