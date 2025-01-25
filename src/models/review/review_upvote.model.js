import mongoose from "mongoose";


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

const ReviewUpvote = mongoose.model('ReviewUpvote', reviewUpvoteSchema);

export default ReviewUpvote;