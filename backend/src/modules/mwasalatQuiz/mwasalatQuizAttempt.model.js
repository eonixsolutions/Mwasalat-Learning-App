import mongoose from 'mongoose';

const mwasalatQuizAttemptSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    // null for a legacy course-level attempt; set to the module's _id for a
    // modular course's per-module quiz attempt — see mwasalatQuiz.model.js.
    moduleId: { type: mongoose.Schema.Types.ObjectId, default: null },
    score: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mwasalatQuizAttemptSchema.index({ learner: 1, program: 1 });
mwasalatQuizAttemptSchema.index({ learner: 1, program: 1, moduleId: 1 });
mwasalatQuizAttemptSchema.index({ program: 1, passed: 1 });

const MwasalatQuizAttempt = mongoose.model('MwasalatQuizAttempt', mwasalatQuizAttemptSchema);
export default MwasalatQuizAttempt;
