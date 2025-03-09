import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import mongoose from 'mongoose';

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log("Connected to database"));

const app = express();
app.use(express.json());
app.use(cors());

/**
 * Server Health Check
 */
app.get("/health", async (req, res) => {
    res.send({ message: "health OK!" });
});

app.use("/api/my/user", myUserRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});