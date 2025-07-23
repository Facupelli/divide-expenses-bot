import { ActiveGroupError } from "../../../modules/user/user.errors";

export function createSuccessUserMessage(names: string[]): string {
	return [
		"✅ Participantes agregados al grupo",
		"",
		names.map((name) => `- ${name}`).join("\n"),
	].join("\n");
}

export function createErrorUserMessage(error: unknown): string {
	if (error instanceof ActiveGroupError) {
		return `❌ Ya tenes un grupo activo. Cerralo y crea uno nuevo!`;
	}

	return "❌ Hubo un error. Prueba de nuevo por favor.";
}
