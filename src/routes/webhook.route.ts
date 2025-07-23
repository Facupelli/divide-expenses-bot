import express from "express";
import { deps } from "../composition";
import { createWebhookController } from "../controllers/webhook.controller";
import { createWebhookValidator } from "../middlewares/validate-webhook.middleware";

const router = express.Router();

const webhookValidator = createWebhookValidator(deps);
const webhookController = createWebhookController(deps);

router.get("/info", webhookController.getWebhookInfo);
router.post(
	"/webhook",
	webhookValidator.validateWebhookSign,
	webhookController.handleWebhook,
);

export default router;
