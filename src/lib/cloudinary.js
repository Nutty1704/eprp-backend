import { v2 as cloudinary } from 'cloudinary'


export const connectCloudinary = async () => {
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
        throw new Error('Cloudinary environment variables are missing');
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    });
}


export const uploadToCloudinary = async (filepath, options = {}) => {
    try {
        const result = await cloudinary.uploader.upload(filepath, options);
        return result;
    } catch (error) {
        console.log('Error uploading to Cloudinary:', error);
        throw error;
    }
};


export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.log('Error deleting from Cloudinary:', error);
        throw error;
    }
}


export const generateCloudinaryUrl = (publicId, options = {}) => {
    try {
        const url = cloudinary.url(publicId, options);
        return url;
    } catch (error) {
        console.log('Error generating Cloudinary URL:', error);
        throw error;
    }
}