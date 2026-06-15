import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const uploadFolder = path.resolve(__dirname, '..', '..', 'uploads', 'avatars');

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const ALLOWED_MIMES = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp'];

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.AWS_ENDPOINT || undefined,
});

const storageTypes = {
    local: multer.diskStorage({
        destination: uploadFolder,
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const hash = crypto.randomBytes(16).toString('hex');
            cb(null, `${hash}${ext}`);
        },
    }),
    s3: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME || '',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const hash = crypto.randomBytes(16).toString('hex');
            cb(null, `avatars/${hash}${ext}`);
        },
    }),
};

export const uploadConfig = multer({
    storage: process.env.AWS_ENDPOINT ? storageTypes.s3 : storageTypes.local,
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato inválido. Use: ${ALLOWED_MIMES.join(', ')}`));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});