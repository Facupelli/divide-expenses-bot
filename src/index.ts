import "dotenv/config";
import cors from "cors";
import express from "express";
import telegramRouter from "./routes/telegram.route";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/telegram", telegramRouter);

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`);
});
