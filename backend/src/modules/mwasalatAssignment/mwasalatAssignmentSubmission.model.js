import mongoose from 'mongoose';

// Multiple submissions per learner/program are allowed (same unlimited-retake
// model as MwasalatQuizAttempt) — no unique index on {learner,program}. The
// most recent submission is what the certificate gate and the learner-facing
// status both look at.
const mwasalatAssignmentSubmissionSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    // null/null for a legacy course-level submission; set for a modular
    // course's assignment-lesson submission — see mwasalatAssignment.model.js.
    moduleId: { type: mongoose.Schema.Types.ObjectId, default: null },
    lessonId: { type: mongoose.Schema.Types.ObjectId, default: null },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    filePublicId: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    score: { type: Number, min: 0, max: 100, default: null },
    passed: { type: Boolean, default: null },
    feedback: { type: String, trim: true, default: '' },
    gradedAt: { type: Date, default: null },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', default: null },
  },
  { timestamps: true }
);

mwasalatAssignmentSubmissionSchema.index({ learner: 1, program: 1 });
mwasalatAssignmentSubmissionSchema.index({ program: 1, status: 1 });
mwasalatAssignmentSubmissionSchema.index({ learner: 1, program: 1, moduleId: 1, lessonId: 1 });

const MwasalatAssignmentSubmission = mongoose.model('MwasalatAssignmentSubmission', mwasalatAssignmentSubmissionSchema);
export default MwasalatAssignmentSubmission;
