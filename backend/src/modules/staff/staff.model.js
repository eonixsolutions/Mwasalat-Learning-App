import mongoose from 'mongoose';
import { ROLES } from '../../constants/index.js';

const INVITABLE_ROLES = [
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

const staffSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    role:       { type: String, enum: INVITABLE_ROLES, required: true },
    branches:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    batches:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch'  }],
    invitedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved:  { type: Boolean, default: false },
    approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt:  { type: Date, default: null },
    isRejected:  { type: Boolean, default: false },
    rejectedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt:  { type: Date, default: null },
    notes:          { type: String, trim: true, default: null },
    microsoftEmail: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

staffSchema.index({ role: 1 });

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
