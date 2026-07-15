import multer from 'multer';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, or WebP images are allowed'), false);
  },
});

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

// Course creation can include a PDF (pdfFile) and/or an uploaded video (videoFile) in
// the same multipart form — each field validated against its own allowed mimetypes.
export const uploadCourseFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB — Cloudinary's direct-upload ceiling
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdfFile') {
      if (file.mimetype === 'application/pdf') return cb(null, true);
      return cb(new Error('Only PDF files are allowed'), false);
    }
    if (file.fieldname === 'videoFile') {
      if (ALLOWED_VIDEO_MIME.includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Only MP4, WebM, or MOV videos are allowed'), false);
    }
    cb(new Error('Unexpected file field'), false);
  },
}).fields([{ name: 'pdfFile', maxCount: 1 }, { name: 'videoFile', maxCount: 1 }]);
