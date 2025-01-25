import mongoose from "mongoose";


const businessCuisineSchema = new mongoose.Schema({
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    cuisine_id: {
        type: String,
        ref: 'Cuisine',
        required: true
    },
});


// Ensure the business_id and cuisine_id are unique as a pair
businessCuisineSchema.index({ business_id: 1, cuisine_id: 1 }, { unique: true });

const BusinessCuisine = mongoose.model('BusinessCuisine', businessCuisineSchema);

export default BusinessCuisine;