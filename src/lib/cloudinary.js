import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

export const connectCloudinary = () => {
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
        throw new Error('Cloudinary environment variables are missing');
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    });

    console.log('Cloudinary connected successfully');
};

export const uploadToCloudinary = async (filepath, options = {}) => {
    try {
        if (!filepath) {
            throw new Error('Missing filepath for upload.');
        }

        if (!options.public_id) {
            throw new Error('Missing public_id. Define a structured ID for better organization.');
        }

        const result = await cloudinary.uploader.upload(filepath, {
            folder: options.folder || undefined, // Set folder if provided
            public_id: options.public_id, // Structured ID
            overwrite: true, // Ensure old images are replaced
            ...options, // Merge any additional options
        });

        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error.message);
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    } finally {
        fs.unlinkSync(filepath); // Remove the temporary file
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) throw new Error('Missing public ID for deletion.');

        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary Delete Error:', error.message);
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
};

export const generateCloudinaryUrl = (publicId, options = {}) => {
    try {
        if (!publicId) throw new Error('Missing public ID for URL generation.');

        return cloudinary.url(publicId, options);
    } catch (error) {
        console.error('Cloudinary URL Generation Error:', error.message);
        throw new Error(`Cloudinary URL generation failed: ${error.message}`);
    }
};
