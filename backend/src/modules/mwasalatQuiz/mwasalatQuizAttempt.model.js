import mongoose from 'mongoose';

const mwasalatQuizAttemptSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mwasalatQuizAttemptSchema.index({ learner: 1, program: 1 });

const MwasalatQuizAttempt = mongoose.model('MwasalatQuizAttempt', mwasalatQuizAttemptSchema);
export default MwasalatQuizAttempt;
