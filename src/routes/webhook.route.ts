import express from "express";
import {
	getWebhookInfo,
	handleWebhook,
} from "../controllers/webhook.controller";

const router = express.Router();

router.get("/info", getWebhookInfo);
router.post("/webhook", handleWebhook);

export default router;
