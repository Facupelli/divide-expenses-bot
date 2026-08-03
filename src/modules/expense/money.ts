const DECIMAL_AMOUNT = /^(?:0|[1-9]\d*)(?:\.(\d{1,2}))?$/;

export function parseAmountToCents(value: string): number {
	if (!DECIMAL_AMOUNT.test(value)) {
		throw new Error(
			"Amount must be a positive decimal with at most two digits",
		);
	}

	const [pesos, fraction = ""] = value.split(".");
	const cents = BigInt(pesos) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
	if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error("Amount is outside the supported range");
	}

	return Number(cents);
}

export function formatAmount(cents: number | bigint): string {
	const value = typeof cents === "bigint" ? cents : BigInt(cents);
	const absolute = value < BigInt(0) ? -value : value;
	const pesos = absolute / BigInt(100);
	const fraction = absolute % BigInt(100);
	const formattedPesos = new Intl.NumberFormat("es-AR", {
		maximumFractionDigits: 0,
	}).format(pesos);
	const sign = value < BigInt(0) ? "-" : "";

	return fraction === BigInt(0)
		? `${sign}$${formattedPesos}`
		: `${sign}$${formattedPesos},${fraction.toString().padStart(2, "0")}`;
}

export function formatFractionalCents(
	numerator: bigint,
	denominator: bigint,
): string {
	const roundedCents =
		(numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
	return formatAmount(roundedCents);
}
