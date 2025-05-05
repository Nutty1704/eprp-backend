import mongoose from "mongoose";

const businessStatsSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        unique: true
    },
    count5Star: {
        type: Number,
        default: 0
    },
    count4Star: {
        type: Number,
        default: 0
    },
    count3Star: {
        type: Number,
        default: 0
    },
    count2Star: {
        type: Number,
        default: 0
    },
    count1Star: {
        type: Number,
        default: 0
    }
});


const BusinessStats = mongoose.model('BusinessStats', businessStatsSchema);

export default BusinessStats;