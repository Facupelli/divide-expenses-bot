export function createStartMessage(): string {
	return [
		"👋 ¡Hola! Soy un bot para registrar y dividir gastos grupales.",
		"",
		"Para empezar, decime quiénes integran el grupo:",
		"“Somos Ana, Beto, Carla y Diego”",
		"",
		"Después podés registrar gastos con mensajes naturales:",
		"“Ana pagó $24.000 de cena”",
		"“Beto pagó $9.000 de taxi, entre Beto, Carla y Diego”",
		"",
		"Usá /ayuda para ver todo lo que puedo hacer.",
	].join("\n");
}

export function createHelpMessage(): string {
	return [
		"🧾 Ayuda para dividir gastos",
		"",
		"1. Creá el grupo indicando sus integrantes:",
		"“Somos Ana, Beto, Carla y Diego”",
		"",
		"2. Registrá gastos con el nombre de quien pagó, el monto y el concepto:",
		"“Ana pagó $24.000 de cena”",
		"Si no aclarás la división, el gasto se reparte entre todo el grupo.",
		"",
		"Para dividirlo entre algunas personas:",
		"“Beto pagó $9.000 de taxi, entre Beto, Carla y Diego”",
		"",
		"Comandos disponibles:",
		"/start - Ver la introducción",
		"/ayuda - Ver esta ayuda",
		"/ver_gastos - Consultar los gastos registrados",
		"/ajuste_cuentas - Ver quién le debe a quién",
		"/cerrar_grupo - Cerrar el grupo actual",
	].join("\n");
}
