import express from 'express';
import recommendationController from '../controllers/recommendation.controller.js';
import { optionalCustomer } from '../middlewares/auth.middleware.js'; // Assuming you'll create this

const router = express.Router();

// GET /api/recommendations - Fetch recommendations
// isCustomerOptional: Attaches req.customer if logged in, otherwise proceeds without error
router.get('/', optionalCustomer, recommendationController.getRecommendations);

export default router;