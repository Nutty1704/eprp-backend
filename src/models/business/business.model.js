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
    review_count: {
        type: Number,
        default: 0
    },
    url: {
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
    }
}, { timestamps: true });


const productModel = mongoose.model('Product', businessSchema);

export default productModel;