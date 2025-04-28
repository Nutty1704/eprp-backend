import express from 'express';
import { isAuthenticated, isCustomer, isOwner } from '../middlewares/auth.middleware.js'
import {
    createReview,
    getReview,
    getReviews,
    updateReview,
    deleteReview,
    voteReview,
    createResponse
} from '../controllers/review.controller.js';
import { uploadImg } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.get('/', getReviews);
router.get('/:reviewId', getReview);

router.post('/create', isAuthenticated, isCustomer, uploadImg.array('images', 3), createReview);
router.post('/update', isAuthenticated, isCustomer, updateReview);
router.post('/vote', isAuthenticated, isCustomer, voteReview);

router.delete('/:reviewId', isAuthenticated, isCustomer, deleteReview);


router.post('/response', isAuthenticated, isOwner, createResponse);

export default router;