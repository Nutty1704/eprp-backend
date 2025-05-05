import Business from "../../models/business/business.model.js"
import BusinessStats from "../../models/business/business_stats.model.js";
import Response from "../../models/review/response.model.js";
import Review from "../../models/review/review.model.js"
import ReviewUpvote from "../../models/review/review_upvote.model.js"
import Customer from "../../models/user/customer.model.js"
import { EntityNotFoundError, InvalidDataError } from "../error-utils.js";

export const getFilteredReviews = async (filter, query) => {
    const { sortBy = "createdAt", order = "desc", minRating, maxRating, limit = 10, page = 1 } = query;

    // Apply rating filters
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxRating) filter.rating = { ...filter.rating, $lte: parseFloat(maxRating) };

    // Sorting logic
    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Pagination logic
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * pageSize;

    // Fetch reviews
    return await Review.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize);
};

export const postCreateReview = async (review) => {
    try {
        const business = await Business.findById(review.businessId);
        if (!business) return;

        const { review_count, foodRating, serviceRating, ambienceRating } = business;
        const newReviewCount = review_count + 1;

        const newRatings = {
            foodRating: ((foodRating * review_count) + review.foodRating) / newReviewCount,
            serviceRating: ((serviceRating * review_count) + review.serviceRating) / newReviewCount,
            ambienceRating: ((ambienceRating * review_count) + review.ambienceRating) / newReviewCount,
        };
        const newRating = (newRatings.foodRating + newRatings.serviceRating + newRatings.ambienceRating) / 3;

        // Update the business rating averages
        await Business.findByIdAndUpdate(review.businessId, {
            rating: newRating,
            foodRating: newRatings.foodRating,
            serviceRating: newRatings.serviceRating,
            ambienceRating: newRatings.ambienceRating,
            review_count: newReviewCount
        });


        // Increment customer review count
        await Customer.findByIdAndUpdate(review.customerId, { $inc: { review_count: 1 } });

        await BusinessStats.findOneAndUpdate({ businessId: review.businessId }, {
            $inc: {
                count5Star: math.floor(review.rating) === 5 ? 1 : 0,
                count4Star: math.floor(review.rating) === 4 ? 1 : 0,
                count3Star: math.floor(review.rating) === 3 ? 1 : 0,
                count2Star: math.floor(review.rating) === 2 ? 1 : 0,
                count1Star: math.floor(review.rating) === 1 ? 1 : 0,
            }
        }, { upsert: true, setDefaultsOnInsert: true });
    } catch (error) {
        console.error("Error updating business ratings:", error);
        throw error;
    }
};


export const postDeleteReview = async (review) => {
    try {
        const business = await Business.findById(review.businessId);
        if (!business) return;

        const { review_count, foodRating, serviceRating, ambienceRating } = business;
        const newReviewCount = review_count - 1;

        if (newReviewCount === 0) {
            // If no reviews remain, reset ratings to 0
            await Business.findByIdAndUpdate(review.businessId, {
                rating: 0,
                foodRating: 0,
                serviceRating: 0,
                ambienceRating: 0,
                review_count: 0
            });
        } else {
            const newRatings = {
                foodRating: ((foodRating * review_count) - review.foodRating) / newReviewCount,
                serviceRating: ((serviceRating * review_count) - review.serviceRating) / newReviewCount,
                ambienceRating: ((ambienceRating * review_count) - review.ambienceRating) / newReviewCount,
            };
            const newRating = (newRatings.foodRating + newRatings.serviceRating + newRatings.ambienceRating) / 3;

            // Otherwise, update the ratings using weighted averaging
            await Business.findByIdAndUpdate(review.businessId, {
                rating: newRating,
                foodRating: newRatings.foodRating,
                serviceRating: newRatings.serviceRating,
                ambienceRating: newRatings.ambienceRating,
                review_count: newReviewCount
            });

            // Decrement customer review count
            await Customer.findByIdAndUpdate(review.customerId, { $inc: { review_count: -1 } });

            await BusinessStats.findOneAndUpdate({ businessId: review.businessId }, {
                $inc: {
                    count5Star: math.floor(review.rating) === 5 ? -1 : 0,
                    count4Star: math.floor(review.rating) === 4 ? -1 : 0,
                    count3Star: math.floor(review.rating) === 3 ? -1 : 0,
                    count2Star: math.floor(review.rating) === 2 ? -1 : 0,
                    count1Star: math.floor(review.rating) === 1 ? -1 : 0,
                }
            }, { upsert: true, setDefaultsOnInsert: true });
        }
    } catch (error) {
        console.error("Error updating business ratings:", error);
        throw error;
    }
};


export const postUpdateReview = async (oldReview, updatedReview) => {
    try {
        const business = await Business.findById(oldReview.businessId);
        if (!business) return;

        const { review_count, foodRating, serviceRating, ambienceRating } = business;

        // Step 1: Subtract the old review values
        let totalFood = (foodRating * review_count) - oldReview.foodRating;
        let totalService = (serviceRating * review_count) - oldReview.serviceRating;
        let totalAmbience = (ambienceRating * review_count) - oldReview.ambienceRating;

        // Step 2: Add the new review values
        totalFood += updatedReview.foodRating;
        totalService += updatedReview.serviceRating;
        totalAmbience += updatedReview.ambienceRating;

        // Step 3: Calculate new averages
        const newFoodRating = totalFood / review_count;
        const newServiceRating = totalService / review_count;
        const newAmbienceRating = totalAmbience / review_count;

        // Step 4: Update the business document
        await Business.findByIdAndUpdate(oldReview.businessId, {
            rating: (newFoodRating + newServiceRating + newAmbienceRating) / 3,
            foodRating: newFoodRating,
            serviceRating: newServiceRating,
            ambienceRating: newAmbienceRating
        });

        await BusinessStats.findOneAndUpdate({ businessId: oldReview.businessId }, {
            $inc: {
                count5Star: math.floor(oldReview.rating) === 5 ? -1 : 0,
                count4Star: math.floor(oldReview.rating) === 4 ? -1 : 0,
                count3Star: math.floor(oldReview.rating) === 3 ? -1 : 0,
                count2Star: math.floor(oldReview.rating) === 2 ? -1 : 0,
                count1Star: math.floor(oldReview.rating) === 1 ? -1 : 0,
            },
            $inc: {
                count5Star: math.floor(updatedReview.rating) === 5 ? 1 : 0,
                count4Star: math.floor(updatedReview.rating) === 4 ? 1 : 0,
                count3Star: math.floor(updatedReview.rating) === 3 ? 1 : 0,
                count2Star: math.floor(updatedReview.rating) === 2 ? 1 : 0,
                count1Star: math.floor(updatedReview.rating) === 1 ? 1 : 0,
            }
        });

    } catch (error) {
        console.error("Error updating business ratings after review update:", error);
        throw error;
    }
};


export const populateUpvotes = async (reviews, customer_id) => {
    try {
        await Promise.all(
            reviews.map(async (review) => {
                review.isUpvoted = await ReviewUpvote.exists({ review_id: review._id, user_id: customer_id });
            })
        );
    } catch (error) {
        console.log('Error populating upvotes:', error);
        throw error;
    }
};


export const isValidOwner = async (ownerId, businessId) => {
    const business = await Business.findById(businessId);

    if (!business) {
        throw new EntityNotFoundError("Business not found.");
    }

    if (business.owner_id !== ownerId) {
        throw new InvalidDataError("You are not the owner of this business.");
    }
}


export const attachResponses = async (reviews) => {
    try {
        const reviewsWithResponses = await Promise.all(
            reviews.map(async (review) => {
                const response = await Response.findOne({ review_id: review._id }).select('text updatedAt');
                return { ...review.toObject(), response };
            })
        );
        
        return reviewsWithResponses;
    } catch (error) {
        console.log('Error attaching responses:', error);
        throw error;
    }
}