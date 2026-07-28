import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [{ type: String, trim: true }],
      validate: { validator: (arr) => arr.length >= 2, message: 'At least 2 options are required' },
    },
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const mwasalatQuizSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    // null for a legacy course-level quiz; set to a program.modules[]._id for
    // a modular course's per-module gating quiz. See mwasalatQuiz.service.js —
    // every lookup is keyed on {program, moduleId} together, so legacy
    // (moduleId: null) and modular quizzes never collide.
    moduleId: { type: mongoose.Schema.Types.ObjectId, default: null },
    questions: {
      type: [quizQuestionSchema],
      validate: { validator: (arr) => arr.length > 0, message: 'At least one question is required' },
    },
    passPercentage: { type: Number, default: 70, min: 0, max: 100 },
  },
  { timestamps: true }
);

mwasalatQuizSchema.index({ program: 1, moduleId: 1 }, { unique: true });

const MwasalatQuiz = mongoose.model('MwasalatQuiz', mwasalatQuizSchema);
export default MwasalatQuiz;
