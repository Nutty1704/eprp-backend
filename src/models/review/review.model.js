import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    foodRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    serviceRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    ambienceRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    rating: {
        type: Number,  // This is the average rating field
    },
    upvotes: {
        type: Number,
        default: 0
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    images: {
        type: [String],
        default: []
    }
}, { timestamps: true });

// Index definitions for `customerId` and `businessId`
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ businessId: 1 });

reviewSchema.pre('save', async function (next) {
    const { foodRating, serviceRating, ambienceRating } = this;

    if (foodRating && serviceRating && ambienceRating) {
        this.rating = (foodRating + serviceRating + ambienceRating) / 3;
    }

    next();
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;