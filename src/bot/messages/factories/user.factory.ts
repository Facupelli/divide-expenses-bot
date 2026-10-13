import {
	ActiveGroupError,
	DuplicateParticipantNamesError,
	EmptyParticipantListError,
	EmptyParticipantNameError,
} from "../../../modules/user/user.errors";

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
	if (error instanceof EmptyParticipantListError) {
		return "❌ Agrega al menos una persona para crear el grupo.";
	}
	if (error instanceof EmptyParticipantNameError) {
		return "❌ Los nombres de los participantes no pueden estar vacíos.";
	}
	if (error instanceof DuplicateParticipantNamesError) {
		const list = error.conflicts
			.map((names) => `• ${names.join(" / ")}`)
			.join("\n");
		return `❌ Estos nombres identifican a la misma persona. Usa un nombre distinto para cada participante:\n${list}`;
	}

	return "❌ Hubo un error. Prueba de nuevo por favor.";
}
