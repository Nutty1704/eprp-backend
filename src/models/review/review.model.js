import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    upvotes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


const Review = mongoose.model('Review', reviewSchema);

export default Review;