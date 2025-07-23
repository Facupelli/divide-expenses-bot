import express from "express";
import { deps } from "../composition";
import { createTelegramController } from "../controllers/telegram.controller";
import { bodyValidate } from "../middlewares/body-validation.middleware";
import {
	setBotNameSchema,
	setCommandsSchema,
} from "../validators/telegram.validator";

const router = express.Router();

const telegramController = createTelegramController(deps);

// router.use(protect);

router.post(
	"/commands",
	bodyValidate(setCommandsSchema),
	telegramController.setCommands,
);
router.post(
	"/bot-name",
	bodyValidate(setBotNameSchema),
	telegramController.setBotName,
);

export default router;
