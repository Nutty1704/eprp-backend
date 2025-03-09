import mongoose from "mongoose";
import Review from "./review.model.js";


const reviewUpvoteSchema = new mongoose.Schema({
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Ensure the review_id and user_id are unique as a pair
reviewUpvoteSchema.index({ review_id: 1, user_id: 1 }, { unique: true });

reviewUpvoteSchema.post('save', async function (doc) {
    try {
        await Review.findByIdAndUpdate(doc.review_id, { $inc: { upvotes: 1 } });
    } catch (error) {
        console.error("Error updating upvotes on save:", error);
    }
});

reviewUpvoteSchema.post('findOneAndDelete', async function (doc) {
    try {
        if (doc) {
            await Review.findByIdAndUpdate(doc.review_id, { $inc: { upvotes: -1 } });
        }
    } catch (error) {
        console.error("Error updating upvotes on delete:", error);
    }
});


const ReviewUpvote = mongoose.model('ReviewUpvote', reviewUpvoteSchema);

export default ReviewUpvote;