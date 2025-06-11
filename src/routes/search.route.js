import express from 'express';
import searchController from '../controllers/search.controller.js';

const router = express.Router();

// Search businesses by name or cuisine
router.get("/", searchController.searchBusinesses);

// Get business by ID (for public access)
router.get("/business/:businessId", searchController.getBusinessById);

export default router;