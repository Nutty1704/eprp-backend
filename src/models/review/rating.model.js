import mongoose from "mongoose";


const ratingSchema = new mongoose.Schema({
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    rating_category_id: {
        type: String,
        ref: 'RatingCategory',
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
});


// Ensure the review_id and rating_category_id are unique as a pair
ratingSchema.index({ review_id: 1, rating_category_id: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;