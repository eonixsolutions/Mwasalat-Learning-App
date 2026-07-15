import mongoose from 'mongoose';

const mwasalatFeedbackSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    courseRating: { type: Number, min: 1, max: 5, required: true },
    instructorRating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

mwasalatFeedbackSchema.index({ learner: 1, program: 1 }, { unique: true });
mwasalatFeedbackSchema.index({ program: 1 });

const MwasalatFeedback = mongoose.model('MwasalatFeedback', mwasalatFeedbackSchema);
export default MwasalatFeedback;
