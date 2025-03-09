import express from 'express';
import { isCustomer } from '../middlewares/auth.middleware.js'
import {
    createReview,
    getReview,
    getReviews,
    updateReview,
    deleteReview,
    voteReview
} from '../controllers/review.controller.js';
import { uploadImg } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.get('/', getReviews);
router.get('/:reviewId', getReview);

router.post('/create', isCustomer, uploadImg.array('images', 3), createReview);
router.post('/update', isCustomer, updateReview);
router.post('/vote', isCustomer, voteReview);

router.delete('/:reviewId', isCustomer, deleteReview);

export default router;