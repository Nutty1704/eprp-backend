import express from 'express';
import dealController from '../controllers/deal.controller.js';
import { isOwner } from '../middlewares/auth.middleware.js'; // Assuming you have this middleware

const router = express.Router();

// --- Owner Routes (Require Authentication/Authorization) ---

// POST /api/deals - Create a new deal
router.post('/', isOwner, dealController.createDeal);

// GET /api/deals/my - Get all deals for the logged-in owner
router.get('/my', isOwner, dealController.getMyDeals);

// GET /api/deals/business/:businessId - Get all deals for a specific business
router.get('/business/:businessId', isOwner, dealController.getDealsForBusiness);

// PUT /api/deals/:dealId - Update a specific deal
router.put('/:dealId', isOwner, dealController.updateDeal);

// DELETE /api/deals/:dealId - Delete a specific deal
router.delete('/:dealId', isOwner, dealController.deleteDeal);

// --- Public Routes ---
// GET /api/deals/public/active - Get active public deals for homepage, etc.
router.get('/public/active', dealController.getActivePublicDeals);

export default router;