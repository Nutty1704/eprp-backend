import mongoose from 'mongoose';
import { deleteFromCloudinary } from '../../lib/cloudinary.js';
import { cloudinaryFolder as customerFolder, getPublicId } from '../../config/cusotmer.config.js';


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