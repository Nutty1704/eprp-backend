import express from 'express';
import { uploadImg } from '../middlewares/multer.middleware.js';
import businessController from '../controllers/business.controller.js';
import { isOwner } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply owner authentication middleware to all business routes
router.use(isOwner);

// Get all businesses for the logged-in owner
router.get("/", businessController.getMyBusinesses);

// Get a specific business by ID
router.get("/:businessId", businessController.getMyBusinessById);

// Create a new business
router.post(
  "/",
  uploadImg.single('image'),
  businessController.createBusiness
);

// Update a business
router.put(
  "/:businessId",
  uploadImg.single('image'),
  businessController.updateBusiness
);

// Delete a business
router.delete("/:businessId", businessController.deleteBusiness);

export default router;