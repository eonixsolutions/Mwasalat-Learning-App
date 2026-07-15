import mongoose from 'mongoose';
import { ENROLLMENT_STATUS } from './mwasalatProgram.constants.js';

const mwasalatEnrollmentSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ENROLLED,
    },
    purchasedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    contentOpenedAt: { type: Date, default: null },
    openedContentTypes: { type: [String], default: [] },
    // Furthest position (seconds) reached in an uploaded course video — only ever
    // increases, so seeking backward to rewatch never reduces recorded progress.
    videoFurthestSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mwasalatEnrollmentSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatEnrollmentSchema.index({ program: 1 });

const MwasalatEnrollment = mongoose.model('MwasalatEnrollment', mwasalatEnrollmentSchema);
export default MwasalatEnrollment;
