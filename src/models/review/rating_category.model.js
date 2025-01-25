import mongoose from "mongoose";


const ratingCategorySchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    }
});



ratingCategorySchema.pre('save', async function (next) {
    if (!this._id) {
        try {
            while (true) {
                newId = `RC${generateRandomId()}`;
                const existingCuisine = await Cuisine.findById(newId);

                if (!existingCuisine) {
                    this._id = newId;
                    break;
                }
            }
        } catch (error) {
            return next(error);
        }
    }
});


const RatingCategory = mongoose.model('RatingCategory', ratingCategorySchema);

export default RatingCategory;


// Helpers

function generateRandomId() {
    return crypto.randomBytes(2).toString('hex');
}