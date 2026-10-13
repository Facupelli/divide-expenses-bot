export function normalizeParticipantName(name: string): string {
	return name
		.trim()
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLocaleLowerCase();
}

export function indexParticipantNames(names: string[]): {
	canonicalNames: Map<string, string>;
	conflicts: string[][];
} {
	const canonicalNames = new Map<string, string>();
	const conflictsByName = new Map<string, string[]>();
	for (const name of names) {
		const normalized = normalizeParticipantName(name);
		const existing = canonicalNames.get(normalized);
		if (existing !== undefined) {
			const variants = conflictsByName.get(normalized) ?? [existing];
			variants.push(name);
			conflictsByName.set(normalized, variants);
		} else {
			canonicalNames.set(normalized, name);
		}
	}
	return { canonicalNames, conflicts: [...conflictsByName.values()] };
}
