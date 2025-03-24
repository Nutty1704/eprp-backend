import mongoose from "mongoose";


const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        default: 0
    },
    foodRating: {
        type: Number,
        default: 0,
    },
    serviceRating: {
        type: Number,
        default: 0
    },
    ambienceRating: {
        type: Number,
        default: 0
    },
    review_count: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String,
    },
    images: {
        type: Array,
        default: []
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price_range_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PriceRange',
    }
}, { timestamps: true });


const businessModel = mongoose.model('Business', businessSchema);

export default businessModel;