import express from 'express';
import dotenv from 'dotenv';

import { connectDB } from './lib/mongodb.js'
import { connectCloudinary } from './lib/cloudinary.js';

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
    connectCloudinary();
});