import mongoose from "mongoose";


const priceRangeSchema = new mongoose.Schema({
    lower_bound: {
        type: Number,
        required: true,
        unique: true,
    },
    upper_bound: {
        type: Number,
        required: true,
        unique: true
    }
});


const PriceRange = mongoose.model('PriceRange', priceRangeSchema);

export default PriceRange;