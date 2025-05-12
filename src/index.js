import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';

import { connectDB } from './lib/mongodb.js'
import { connectCloudinary } from './lib/cloudinary.js';
import passport from './lib/passport.js';
import scheduleDealStatusUpdates from './lib/deal-utils.js';

// Router imports
import authRouter from './routes/auth.route.js';
import customerRouter from './routes/customer.route.js';
import reviewRouter from './routes/review.route.js';
import businessRouter from './routes/business.route.js';
import searchRouter from './routes/search.route.js';
import cuisineRouter from './routes/cuisine.route.js';
import dealRouter from './routes/deal.route.js';
import recommendationRouter from './routes/recommendation.route.js';

import mongoose from 'mongoose';
import errorHandler from './middlewares/error-handler.middleware.js';
import { isCustomer } from './middlewares/auth.middleware.js';


dotenv.config(); // Load environment variables from .env file
connectDB(); // Connect to MongoDB
connectCloudinary(); // Connect to Cloudinary

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
        },
        store: MongoStore.create({
            client: mongoose.connection.getClient(),
            ttl: 1000 * 60 * 60 * 24 * 3, // Delete sessions older than 3 days
        })
    })
);


// Initialize passport js
app.use(passport.initialize());
app.use(passport.session());

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/customer', isCustomer, customerRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/business', businessRouter);
app.use('/api/search', searchRouter);
app.use('/api/cuisines', cuisineRouter);
app.use('/api/deals', dealRouter);
app.use('/api/recommendations', recommendationRouter);

// Error handling middleware
app.use(errorHandler);

// Start Scheduled Jobs (AFTER DB connection and setup)
scheduleDealStatusUpdates();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});