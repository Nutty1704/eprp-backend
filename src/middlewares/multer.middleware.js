import multer from 'multer';
import path from 'path';
import fs from 'fs';

const imgStorage = new multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), 'tmp', 'images');

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' +  uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

export const uploadImg = multer({
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
