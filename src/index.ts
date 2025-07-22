import "dotenv/config";
import cors from "cors";
import express from "express";
import telegramRouter from "./routes/telegram.route";
import webhookRouter from "./routes/webhook.route";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/", webhookRouter);
app.use("/telegram", telegramRouter);

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`);
});
