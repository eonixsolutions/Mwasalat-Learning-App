import mongoose from 'mongoose';
import { CONTENT_TYPES, PROGRAM_STATUS } from './mwasalatProgram.constants.js';

const mwasalatProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true },
    description: { type: String, trim: true },
    contentTypes: {
      type: [{ type: String, enum: Object.values(CONTENT_TYPES) }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one content type',
      },
    },
    // Populated depending on which contentTypes are selected
    pdfUrl: { type: String, trim: true },
    recordingLink: { type: String, trim: true },
    // Set when the instructor uploads a video directly instead of pasting a link. The
    // Cloudinary asset itself is stored as 'authenticated' (no permanent public URL) —
    // a fresh signed URL is generated per-request (see getVideoUrl), so exposing this
    // id alone isn't enough to access the file without the server-side signature.
    recordingVideoPublicId: { type: String, trim: true },
    recordingVideoDurationSeconds: { type: Number },
    liveScheduledAt: { type: Date },
    liveMeetingLink: { type: String, trim: true },
    iltVenue: { type: String, trim: true },
    iltScheduledAt: { type: Date },
    duration: { type: String, trim: true },
    price: { type: Number, default: 0 },
    expiryDate: { type: Date },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
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
