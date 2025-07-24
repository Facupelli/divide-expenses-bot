import express from "express";
import { deps } from "../composition";
import { createWebhookValidator } from "../middlewares/validate-webhook.middleware";
import { createWebhookController } from "./webhook.controller";

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
