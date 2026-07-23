import mongoose from 'mongoose';
import { CONTENT_TYPES, PROGRAM_STATUS } from './mwasalatProgram.constants.js';

const mwasalatProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    categoryAr: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    subCategoryAr: { type: String, trim: true },
    description: { type: String, trim: true },
    descriptionAr: { type: String, trim: true },
    contentTypes: {
      type: [{ type: String, enum: Object.values(CONTENT_TYPES) }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one content type',
      },
    },
    // Populated depending on which contentTypes are selected
    pdfUrl: { type: String, trim: true },
    // Optional day count for PDF content — when set, the learner's PDF progress
    // increments by 1/N for each distinct calendar day they open it (see
    // markContentOpened) instead of jumping straight to done on first open.
    pdfDurationDays: { type: Number, min: 1 },
    recordingLink: { type: String, trim: true },
    // Set when the instructor uploads a video directly instead of pasting a link. The
    // Cloudinary asset itself is stored as 'authenticated' (no permanent public URL) —
    // a fresh signed URL is generated per-request (see getVideoUrl), so exposing this
    // id alone isn't enough to access the file without the server-side signature.
    recordingVideoPublicId: { type: String, trim: true },
    recordingVideoDurationSeconds: { type: Number },
    liveScheduledAt: { type: Date },
    liveMeetingLink: { type: String, trim: true },
    // Set when the link above was generated through the Zoom integration
    // instead of pasted manually (see backend/src/integrations/zoom.js).
    liveMeetingProvider: { type: String, trim: true },
    // Host-only Zoom URL — authenticates as the meeting host without a
    // separate Zoom login. Never sent to learners; getById strips it for
    // anyone but the course's own instructor/admin (see mwasalatProgram.service.js).
    liveMeetingStartUrl: { type: String, trim: true, select: false },
    iltVenue: { type: String, trim: true },
    iltScheduledAt: { type: Date },
    // Seat limit for session-based delivery (live/ILT) — irrelevant for
    // self-paced pdf/recording content, so left unset there.
    capacity: { type: Number, min: 1 },
    duration: { type: String, trim: true },
    durationAr: { type: String, trim: true },
    price: { type: Number, default: 0 },
    expiryDate: { type: Date },
    // Some certifications (e.g. safety/compliance training) must be renewed periodically.
    // When set, a learner's certificate for this course expires this many months after
    // issuance; left unset, the certificate is valid for life.
    certificateValidityMonths: { type: Number, min: 1 },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    // Learners must complete this other course (have a MwasalatEnrollment with
    // completedAt set) before they're allowed to enroll in this one.
    prerequisiteProgram: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', default: null },
    status: {
      type: String,
      enum: Object.values(PROGRAM_STATUS),
      default: PROGRAM_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

mwasalatProgramSchema.index({ instructor: 1 });
mwasalatProgramSchema.index({ status: 1 });

const MwasalatProgram = mongoose.model('MwasalatProgram', mwasalatProgramSchema);
export default MwasalatProgram;
