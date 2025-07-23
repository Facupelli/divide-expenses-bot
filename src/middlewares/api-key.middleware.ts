import type { NextFunction, Request, Response } from "express";

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
	const apiKey = req.headers["x-api-key"];
	const expectedKey = process.env.API_KEY;

	if (!expectedKey) {
		return res.status(500).json({ error: "API key not configured on server" });
	}

	if (apiKey !== expectedKey) {
		return res.status(401).json({ error: "Unauthorized: Invalid API key" });
	}

	next();
};
