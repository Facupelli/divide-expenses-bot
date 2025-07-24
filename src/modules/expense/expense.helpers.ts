import dayjs from "../../dayjs";

export function formatAmount(value: number) {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 *  • "Today at 2:34 PM"
 *  • "Yesterday at 9:05 AM"
 *  • "Mon at 11:20 AM"  (same week)
 *  • "Jul 22"           (same year)
 *  • "Dec 4, 2022"      (other years)
 */
export function formatTimestamp(
	input: dayjs.ConfigType,
	now: dayjs.ConfigType = new Date(),
): string {
	const d = dayjs.utc(input).local();
	const today = dayjs(now).startOf("day");

	// Today
	if (d.isToday()) {
		return `Hoy ${d.format("HH:mm")}`;
	}

	// Yesterday
	if (d.isYesterday()) {
		return `Ayer ${d.format("HH:mm")}`;
	}

	// Same calendar week (Sun-Sat)
	const startOfWeek = today.weekday(0); // Sunday
	if (d.isSameOrAfter(startOfWeek) && d.isBefore(today)) {
		return `${d.format("ddd")} ${d.format("HH:mm")}`;
	}

	// Same year
	if (d.year() === today.year()) {
		return d.format("MMM D");
	}

	// Other years
	return d.format("MMM D, YYYY");
}
