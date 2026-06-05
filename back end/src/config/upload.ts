import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';

const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});


const ALLOWED_MIMES = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp'];

export const uploadConfig = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME as string,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const hash = crypto.randomBytes(16).toString('hex');
            cb(null, `avatars/${hash}${ext}`);
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