import mongoose from "mongoose";


const openingHoursSchema = new mongoose.Schema({
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open_time: {
        type: String,
        required: true
    },
    close_time: {
        type: String,
        required: true
    }
}, { timestamps: true });


// Ensure the business_id and day are unique as a pair
openingHoursSchema.index({ business_id: 1, day: 1 }, { unique: true });

const OpeningHours = mongoose.model('OpeningHours', openingHoursSchema);

export default OpeningHours;