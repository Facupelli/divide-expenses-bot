import { RateLimiterMemory } from "rate-limiter-flexible";

// 8 requests per 10 seconds window per chat
export const msgLimiter = new RateLimiterMemory({
	keyPrefix: "tg_msg",
	points: 8,
	duration: 10,
});
