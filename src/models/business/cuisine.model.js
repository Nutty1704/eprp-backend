import mongoose from "mongoose";

const cuisineSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
});


cuisineSchema.pre('save', async function (next) {
    if (!this._id) {
        try {
            while (true) {
                newId = `C${generateRandomId()}`;
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


const Cuisine = mongoose.model('Cuisine', cuisineSchema);

export default Cuisine;


// Helpers

function generateRandomId() {
    return crypto.randomBytes(2).toString('hex');
}