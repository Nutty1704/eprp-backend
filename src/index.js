import express from 'express';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});