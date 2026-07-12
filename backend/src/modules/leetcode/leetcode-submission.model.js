import mongoose from 'mongoose';

const leetcodeSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'LeetCodeProblem', required: true },
    // 0 = submitted on the assigned day, 1 = 1 working day late, etc.
    daysLate: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One submission per student per problem
leetcodeSubmissionSchema.index({ student: 1, problem: 1 }, { unique: true });
leetcodeSubmissionSchema.index({ student: 1 });

const LeetCodeSubmission = mongoose.model('LeetCodeSubmission', leetcodeSubmissionSchema);
export default LeetCodeSubmission;
