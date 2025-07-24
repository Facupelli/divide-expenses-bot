import { Redis } from "ioredis";

export const redis = new Redis(
	process.env.REDIS_MASTER_URL || "redis://localhost:6379",
	{
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	},
);

redis.on("error", (err) => {
	console.error("Redis connection error:", err);
	redis.disconnect();
	process.exit(1);
});

redis.on("connect", () => {
	console.log("Redis connected");
});
