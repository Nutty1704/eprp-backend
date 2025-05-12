import mongoose from 'mongoose';
import { deleteFromCloudinary } from '../../lib/cloudinary.js';
import { cloudinaryFolder as customerFolder, getPublicId } from '../../config/customer.config.js';


const customerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; },
    },
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true
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
    preferredCuisines: {
        type: [String], 
        default: [],
    },
    preferredSuburb: { 
        type: String,
        trim: true,
        default: null,
    },
}, { timestamps: true });


customerSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.profile_image) {
        try {
            const publicId = `${customerFolder}/${getPublicId(doc)}`;
            await deleteFromCloudinary(publicId);
        } catch (error) {
            console.error(`Failed to delete Cloudinary image for customer ${doc._id}:`, error);
        }
    }
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;