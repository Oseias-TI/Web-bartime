import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const uploadFolder = path.resolve(__dirname, '..', '..', 'uploads', 'avatars');

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const ALLOWED_MIMES = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp'];

export const uploadConfig = multer({
    storage: multer.diskStorage({
        destination: uploadFolder,
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const hash = crypto.randomBytes(16).toString('hex');
            cb(null, `${hash}${ext}`);
        },
    }),
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato inválido. Use: ${ALLOWED_MIMES.join(', ')}`));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});