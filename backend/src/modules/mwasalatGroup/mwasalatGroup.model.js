import mongoose from 'mongoose';

// User Groups / Cohorts — an ad-hoc roster (e.g. "Q1 2026 New Hires") used to
// target mandatory-training assignments (see mwasalatProgram.service.js
// assignToTargets) independently of the org-chart department structure.
const mwasalatGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true },
    description: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatDepartment', default: null },
    members: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser' }], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mwasalatGroupSchema.index({ isActive: 1 });
mwasalatGroupSchema.index({ members: 1 });

const MwasalatGroup = mongoose.model('MwasalatGroup', mwasalatGroupSchema);
export default MwasalatGroup;
