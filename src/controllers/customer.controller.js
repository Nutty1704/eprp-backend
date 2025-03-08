import { deleteFromCloudinary, uploadToCloudinary } from "../lib/cloudinary.js"
import { InvalidDataError } from "../lib/error-utils.js"
import Customer from "../models/user/customer.model.js"
import User from "../models/user/user.model.js"
import { logout } from "./auth.controller.js"
import { cloudinaryFolder as customerFolder, getPublicId } from '../config/customer.config.js'


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
        if (req.customer.profile_image) {
            const publicId = customerFolder + '/' + getPublicId(req.customer);

            try {
                await deleteFromCloudinary(publicId);

                updates.profile_image = null;
            } catch (error) {
                return next(new Error('Failed to delete profile image from Cloudinary.'));
            }
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
    await Customer.findByIdAndDelete(req.customer._id);

    if (!req.user.roles.owner) {
        await User.findByIdAndDelete(req.user._id);
    }

    logout(req, res, next);
}