import mongoose from "mongoose";
import Review from "./review.model.js";


const reviewUpvoteSchema = new mongoose.Schema({
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Ensure the reviewId and customerId are unique as a pair
reviewUpvoteSchema.index({ reviewId: 1, customerId: 1 }, { unique: true });

reviewUpvoteSchema.post('save', async function (doc) {
    try {
        await Review.findByIdAndUpdate(doc.reviewId, { $inc: { upvotes: 1 } });
    } catch (error) {
        console.error("Error updating upvotes on save:", error);
    }
});

reviewUpvoteSchema.post('findOneAndDelete', async function (doc) {
    try {
        if (doc) {
            await Review.findByIdAndUpdate(doc.reviewId, { $inc: { upvotes: -1 } });
        }
    } catch (error) {
        console.error("Error updating upvotes on delete:", error);
    }
});


const ReviewUpvote = mongoose.model('ReviewUpvote', reviewUpvoteSchema);

export default ReviewUpvote;