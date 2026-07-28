import multer from 'multer';

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'avatar') return cb(new Error('Unexpected file field'), false);
    if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, or WebP images are allowed'), false);
  },
}).single('avatar');

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

// Course creation can include one or more PDFs (pdfFile, up to 10) and/or an uploaded
// video (videoFile) in the same multipart form — each field validated against its own
// allowed mimetypes.
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
}).fields([{ name: 'pdfFile', maxCount: 10 }, { name: 'videoFile', maxCount: 1 }]);

const ALLOWED_LESSON_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_LESSON_AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg'];
const ALLOWED_LESSON_PPT_MIME = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

// A single module lesson (video/pdf/ppt/audio) carries at most one file —
// unlike uploadCourseFiles (which can take a pdf set AND a video together for
// the legacy flat course), lessons are added one at a time from the module
// builder, so this is a single 'file' field whose allowed mimetypes depend on
// which lesson type the instructor picked (checked in mwasalatProgram.service.js
// addLesson/updateLesson, not here, since multer's fileFilter never sees the
// other form fields reliably across browsers).
export const uploadLessonFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB, same ceiling as uploadCourseFiles
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'file') return cb(new Error('Unexpected file field'), false);
    const allAllowed = [
      'application/pdf',
      ...ALLOWED_LESSON_VIDEO_MIME,
      ...ALLOWED_LESSON_AUDIO_MIME,
      ...ALLOWED_LESSON_PPT_MIME,
    ];
    if (allAllowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type for a lesson'), false);
  },
}).single('file');

const ALLOWED_CSV_MIME = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain'];

// Bulk user import — browsers/OSes are inconsistent about the mimetype they report
// for .csv (Excel-exported files often show up as application/vnd.ms-excel or even
// text/plain), so the extension is checked as a fallback rather than trusting mimetype alone.
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_CSV_MIME.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(null, true);
    }
    cb(new Error('Only CSV files are allowed'), false);
  },
}).single('file');

const ALLOWED_ASSIGNMENT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
];
const ALLOWED_ASSIGNMENT_EXT = ['.pdf', '.doc', '.docx', '.zip'];

// Learner assignment submissions — mimetype sniffing for .docx/.zip is as
// inconsistent across browsers/OSes as it is for CSV, so fall back to the
// file extension the same way uploadCsv does.
export const uploadAssignmentSubmission = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'file') return cb(new Error('Unexpected file field'), false);
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (ALLOWED_ASSIGNMENT_MIME.includes(file.mimetype) || ALLOWED_ASSIGNMENT_EXT.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, or ZIP files are allowed'), false);
  },
}).single('file');
