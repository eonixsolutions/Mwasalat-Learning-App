import mongoose from 'mongoose';

const leetcodeProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    leetcodeNo: { type: Number, default: null },
    leetcodeUrl: { type: String, required: true, trim: true },
    list: { type: String, enum: ['general', 'javascript'], required: true },
    topic: { type: String, default: '', trim: true },
    hints: { type: [String], default: [] },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

leetcodeProblemSchema.index({ list: 1, order: 1 });
leetcodeProblemSchema.index({ isActive: 1 });

const LeetCodeProblem = mongoose.model('LeetCodeProblem', leetcodeProblemSchema);
export default LeetCodeProblem;
