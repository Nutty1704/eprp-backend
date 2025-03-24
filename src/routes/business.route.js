import express from 'express';
import { uploadImg } from '../middlewares/multer.middleware.js';
import businessController from '../controllers/business.controller.js';


const router = express.Router();

router.get("/", businessController.getMyBusiness);

router.post(
  "/",
  uploadImg.single('profile_image'),
  businessController.createMyBusiness
);

router.put(
  "/",
  uploadImg.single('profile_image'),
  businessController.updateMyBusiness
);

export default router;