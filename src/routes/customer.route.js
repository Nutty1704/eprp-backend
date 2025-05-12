import express from 'express';
import {
    deleteCustomer,
    getCustomer,
    updateCustomer,
    updateMyPreferences
} from '../controllers/customer.controller.js';
import { uploadImg } from '../middlewares/multer.middleware.js';
import { isCustomer } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getCustomer);
router.put('/', uploadImg.single('profile_image'), updateCustomer);
router.delete('/', deleteCustomer);
router.put('/me/preferences', isCustomer, updateMyPreferences);

export default router;