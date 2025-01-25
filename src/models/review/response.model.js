import mongoose from "mongoose";


const responseSchema = new mongoose.Schema({
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    text: {
        type: String,
        required: true,
    }
}, { timestamps: true });


// Ensure the business_id and review_id are unique as a pair
responseSchema.index({ business_id: 1, review_id: 1 }, { unique: true });

const Response = mongoose.model('Response', responseSchema);

export default Response;