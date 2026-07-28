import mongoose from 'mongoose';

const mwasalatFeedbackSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    courseRating: { type: Number, min: 1, max: 5, required: true },
    instructorRating: { type: Number, min: 1, max: 5, required: true },
    // "Was the trainer clear?" — optional so existing feedback docs (created
    // before this field existed) don't fail validation on read.
    trainerClear: { type: Boolean, default: null },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

mwasalatFeedbackSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatFeedbackSchema.index({ program: 1 });

const MwasalatFeedback = mongoose.model('MwasalatFeedback', mwasalatFeedbackSchema);
export default MwasalatFeedback;
