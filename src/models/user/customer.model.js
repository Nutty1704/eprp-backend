import mongoose from 'mongoose';


const customerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: ""
    },
    review_count: {
        type: Number,
        default: 0
    },
    profile_image: {
        type: String,
        default: null
    },
}, { timestamps: true });


const Customer = mongoose.model('Customer', customerSchema);

export default Customer;