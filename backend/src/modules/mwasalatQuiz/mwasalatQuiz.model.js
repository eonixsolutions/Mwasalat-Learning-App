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
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true, unique: true },
    questions: {
      type: [quizQuestionSchema],
      validate: { validator: (arr) => arr.length > 0, message: 'At least one question is required' },
    },
    passPercentage: { type: Number, default: 70, min: 0, max: 100 },
  },
  { timestamps: true }
);

const MwasalatQuiz = mongoose.model('MwasalatQuiz', mwasalatQuizSchema);
export default MwasalatQuiz;
