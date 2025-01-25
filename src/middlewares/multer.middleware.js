import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from '@fluidjs/multer-cloudinary';

const imgStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    },
});

const uploadImg = multer({
    storage: imgStorage,
    limits: {
        fileSize: 1024 * 1024 * 10, // 10 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    }
});


export default uploadImg;