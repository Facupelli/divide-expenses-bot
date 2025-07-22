import express from "express";
import { setBotName, setCommands } from "../controllers/telegram.controller";
import { bodyValidate } from "../middlewares/body-validation.middleware";
import {
	setBotNameSchema,
	setCommandsSchema,
} from "../validators/telegram.validator";

const router = express.Router();

// router.use(protect);

router.post("/commands", bodyValidate(setCommandsSchema), setCommands);
router.post("/bot-name", bodyValidate(setBotNameSchema), setBotName);

export default router;
