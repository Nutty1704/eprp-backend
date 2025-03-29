import express from 'express';
import { uploadImg } from '../middlewares/multer.middleware.js';
import businessController from '../controllers/business.controller.js';
import { isOwner } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply owner authentication middleware to all business routes
router.use(isOwner);

// Configure multer for multiple file uploads
const multiUpload = uploadImg.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'menuItemImage', maxCount: 1 }
]);

// Get all businesses for the logged-in owner
router.get("/", businessController.getMyBusinesses);

// Get a specific business by ID
router.get("/:businessId", businessController.getMyBusinessById);

// Create a new business
router.post(
  "/",
  multiUpload,
  businessController.createBusiness
);

// Update a business
router.put(
  "/:businessId",
  multiUpload,
  businessController.updateBusiness
);

// Delete a business
router.delete("/:businessId", businessController.deleteBusiness);

export default router;