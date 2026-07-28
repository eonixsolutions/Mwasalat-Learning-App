import mongoose from 'mongoose';

// One assignment per course (legacy) or per assignment-type lesson inside a
// module (modular) — its mere existence is what makes it "required" for
// certificate issuance (see maybeCompleteEnrollment in mwasalatProgram.service.js).
// moduleId/lessonId are both null for a legacy course-level assignment; a
// modular course can have more than one assignment lesson (unlike quiz, which
// is capped at one per module), so this is keyed by all three fields together.
const mwasalatAssignmentSchema = new mongoose.Schema(
  {
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, default: null },
    lessonId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true, trim: true },
    instructionsAr: { type: String, trim: true },
    maxScore: { type: Number, default: 100, min: 1 },
  },
  { timestamps: true }
);

mwasalatAssignmentSchema.index({ program: 1, moduleId: 1, lessonId: 1 }, { unique: true });

const MwasalatAssignment = mongoose.model('MwasalatAssignment', mwasalatAssignmentSchema);
export default MwasalatAssignment;
