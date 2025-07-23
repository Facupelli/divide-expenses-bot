import express from "express";
import { deps } from "../composition";
import { createWebhookController } from "../controllers/webhook.controller";

const router = express.Router();

const webhookController = createWebhookController(deps);

// router.use(protect);

router.get("/info", webhookController.getWebhookInfo);
router.post("/webhook", webhookController.handleWebhook);

export default router;
