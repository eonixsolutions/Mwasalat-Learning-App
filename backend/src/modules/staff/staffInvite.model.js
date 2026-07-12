import mongoose from 'mongoose';
import { ROLES } from '../../constants/index.js';

const INVITABLE_ROLES = [
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_COORDINATOR,
  ROLES.TECHNICAL_MENTOR,
  ROLES.COMMUNICATION_MENTOR,
];

const staffInviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    role:  { type: String, enum: INVITABLE_ROLES, required: true },
    email: { type: String, trim: true, lowercase: true, default: null },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isUsed:     { type: Boolean, default: false },
    usedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    usedAt:     { type: Date, default: null },
    isRevoked:  { type: Boolean, default: false },
    expiresAt:  { type: Date, required: true },
  },
  { timestamps: true }
);

staffInviteSchema.index({ isUsed: 1, isRevoked: 1, expiresAt: 1 });

const StaffInvite = mongoose.model('StaffInvite', staffInviteSchema);
export default StaffInvite;
