import { deleteFromCloudinary, uploadToCloudinary } from "../lib/cloudinary.js"
import { InvalidDataError } from "../lib/error-utils.js"
import Customer from "../models/user/customer.model.js"
import { logout } from "./auth.controller.js"
import { cloudinaryFolder as customerFolder, getFullId, getPublicId } from '../config/customer.config.js'


export const getCustomer = (req, res, next) => {
    res.status(200).json({ success: true, error: false, data: req.customer });
}


export const updateCustomer = async (req, res, next) => {
    const { name, bio, removeProfileImage } = req.body;

    // Check if no name, bio, or file is provided
    if (!name && !bio && !req.file && !removeProfileImage) {
        return next(new InvalidDataError("Missing name, bio, profile picture, or removeProfileImage flag."));
    }

    const updates = {
        name: name || req.customer.name,
        bio: bio || req.customer.bio
    };

    if (removeProfileImage) {
        const removed = await removeProfileImageFromCloudinary(req.customer, next);

        if (removed) {
            updates.profile_image = null;
        }
    }

    if (req.file) {
        const filepath = req.file.path;
        const publicId = getPublicId(req.customer);

        try {
            const cloudinaryResult = await uploadToCloudinary(filepath, {
                public_id: publicId,
                folder: customerFolder
            });

            updates.profile_image = cloudinaryResult.secure_url;
        } catch (error) {
            return next(new Error('Failed to upload profile image to Cloudinary.'));
        }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(req.customer._id, updates, { new: true });
    res.status(200).json({ success: true, error: false, data: updatedCustomer });
};


export const deleteCustomer = async (req, res, next) => {
    await removeProfileImageFromCloudinary(req.customer, next);

    await Customer.findByIdAndDelete(req.customer._id);

    logout(req, res, next);
}


// Helper function to remove profile image
const removeProfileImageFromCloudinary = async (customer, next) => {
    if (customer.profile_image) {
        const publicId = getFullId(customer);

        try {
            await deleteFromCloudinary(publicId);
            return true;
        } catch (error) {
            return next(new Error('Failed to delete profile image from Cloudinary.'));
        }
    }
}