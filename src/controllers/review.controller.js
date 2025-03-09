import Review from "../models/review/review.model.js"
import { InvalidDataError, EntityNotFoundError } from '../lib/error-utils.js'
import ReviewUpvote from "../models/review/review_upvote.model.js"
import {
    getFilteredReviews, populateUpvotes,
    postCreateReview, postDeleteReview,
    postUpdateReview
} from "../lib/db/review-utils.js"
import {
    cloudinaryFolder as reviewsFolder,
    getPublicId
} from "../config/review.config.js"
import { deleteFromCloudinary, extractPublicIdFromUrl, uploadToCloudinary } from "../lib/cloudinary.js"

export const getReviews = async (req, res, next) => {
    try {
        const { customerId, businessId } = req.query;

        if (!customerId && !businessId) {
            return next(new InvalidDataError("Missing businessId or customerId."));
        }

        const filter = customerId ? { customerId } : { businessId };
        const reviews = await getFilteredReviews(filter, req.query);

        if (customerId) {
            await populateUpvotes(reviews, customerId);
        }

        res.status(200).json({ success: true, error: false, data: reviews });
    } catch (error) {
        next(error);
    }
};

export const getReview = async (req, res, next) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        return next(new InvalidDataError("Missing reviewId."));
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        next(new EntityNotFoundError("Review not found."));
    }

    if (req.customer) {
        await populateUpvotes([review], req.customer._id);
    }

    res.status(200).json({ success: true, error: false, data: review });
}

export const createReview = async (req, res, next) => {
    const customerId = req.customer._id;
    const {
        businessId, text, foodRating,
        serviceRating, ambienceRating
    } = req.body;

    if (!businessId || !text || !foodRating || !serviceRating || !ambienceRating) {
        return next(new InvalidDataError("All fields are required: businessId, text, foodRating, serviceRating, ambienceRating."));
    }

    const review = new Review({
        businessId,
        customerId,
        text,
        foodRating,
        serviceRating,
        ambienceRating
    });

    const images = req.files;

    review.images = images
        ? await Promise.all(images.map(async (image) => {
            const publicId = getPublicId(review, images.indexOf(image) + 1);
            const result = await uploadToCloudinary(image.path, {
                public_id: publicId,
                folder: reviewsFolder
            });
            return result.secure_url;
        }))
        : [];

    await review.save();

    await postCreateReview(review);

    res.status(200).json({ success: true, error: false, data: review });

}

export const updateReview = async (req, res, next) => {
    try {
        const customerId = req.customer._id;
        const { reviewId, text, foodRating, serviceRating, ambienceRating } = req.body;

        const review = await Review.findOne({ _id: reviewId, customerId });

        if (!review) {
            return next(new EntityNotFoundError("Review not found."));
        }

        const oldReview = review.toObject();

        const updatedFields = {
            text: text || review.text,
            foodRating: foodRating || review.foodRating,
            serviceRating: serviceRating || review.serviceRating,
            ambienceRating: ambienceRating || review.ambienceRating
        };

        const updatedReview = await Review.findByIdAndUpdate(reviewId, updatedFields, { new: true });

        await postUpdateReview(oldReview, updatedReview);

        res.status(200).json({ success: true, error: false, data: updatedReview });
    } catch (error) {
        next(error);
    }
};

export const deleteReview = async (req, res, next) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        return next(new InvalidDataError("Missing reviewId."));
    }

    const review = await Review.findOne({ _id: reviewId, customerId: req.customer._id });

    if (!review) {
        return next(new EntityNotFoundError("Review not found."));
    }

    await removeImagesFromCloudinary(review, next);

    const deletedReview = review.toObject();

    await Review.findByIdAndDelete(reviewId);

    await postDeleteReview(deletedReview);

    res.status(200).json({ success: true, error: false });
};

export const voteReview = async (req, res, next) => {
    const { reviewId: review_id, action } = req.body;
    const user_id = req.customer.user_id;

    if (!review_id) {
        return next(new InvalidDataError("Missing reviewId."));
    }

    if (!["upvote", "downvote"].includes(action)) {
        return next(new InvalidDataError("Invalid action."));
    }

    try {
        if (action === "upvote") {
            if (!await ReviewUpvote.exists({ review_id, user_id })) {
                await ReviewUpvote.create({ review_id, user_id });
            }
        } else {
            // Remove the upvote if it exists (downvote = remove vote)
            await ReviewUpvote.findOneAndDelete({ review_id, user_id });
        }

        res.status(200).json({ success: true, error: false });
    } catch (error) {
        next(error);
    }
};


// Helper function to remove images from Cloudinary when a review is deleted
const removeImagesFromCloudinary = async (review, next) => {
    try {
        if (review.images && review.images.length > 0) {
            await Promise.all(
                review.images.map(async (image) => {
                    const publicId = extractPublicIdFromUrl(image);
                    await deleteFromCloudinary(publicId);
                })
            )
        }
    } catch (error) {
        next(error);
    }
}