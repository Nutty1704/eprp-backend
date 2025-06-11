import express from 'express';
import {
    deleteCustomer,
    getCustomer,
    updateCustomer
} from '../controllers/customer.controller.js';
import { uploadImg } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.get('/', getCustomer);
router.put('/', uploadImg.single('profile_image'), updateCustomer);
router.delete('/', deleteCustomer);

export default router;