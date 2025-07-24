import "dotenv/config";
import Database from "better-sqlite3";
import cors from "cors";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import express from "express";
import telegramRouter from "./bot/telegram/telegram.route";
import webhookRouter from "./webhook/webhook.route";

const isProd = process.env.NODE_ENV === "production";

async function runMigrations(): Promise<void> {
	const dbPath = process.env.SQLITE_PATH || "./data/app.db";

	console.log(`Connecting to database at: ${dbPath}`);
	const sqlite = new Database(dbPath);
	const db = drizzle(sqlite);

	try {
		console.log("Running database migrations...");

		await migrate(db, { migrationsFolder: "./src/db/migrations" });

		console.log("✅ Migrations completed successfully");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		sqlite.close();
	}
}

async function startServer(): Promise<void> {
	try {
		if (isProd) {
			await runMigrations();
		}

		const app = express();
		const PORT = process.env.PORT || 3000;

		// Middleware
		app.use(cors());
		app.use(express.json());

		// Routes
		app.use("/", webhookRouter);
		app.use("/telegram", telegramRouter);

		// Health check endpoint (useful for deployment platforms)
		app.get("/health", (_, res) => {
			res
				.status(200)
				.json({ status: "healthy", timestamp: new Date().toISOString() });
		});

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port: ${PORT}`);
			console.log(
				`📊 Health check available at: http://localhost:${PORT}/health`,
			);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

startServer().catch((error) => {
	console.error("💥 Unhandled error during startup:", error);
	process.exit(1);
});
