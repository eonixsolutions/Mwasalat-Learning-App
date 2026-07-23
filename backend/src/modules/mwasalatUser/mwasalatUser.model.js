import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';

const mwasalatUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () { return this.authProvider === 'local'; },
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(MWASALAT_ROLES),
      default: MWASALAT_ROLES.LEARNER,
    },
    isActive: { type: Boolean, default: true },
    passwordSet: { type: Boolean, default: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, select: false },
    points: { type: Number, default: 0 },
    invitationToken: { type: String, select: false },
    invitationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    lastLogin: { type: Date },
    consentAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

mwasalatUserSchema.index({ isActive: 1 });
mwasalatUserSchema.index({ role: 1 });

mwasalatUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

mwasalatUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

mwasalatUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const MwasalatUser = mongoose.model('MwasalatUser', mwasalatUserSchema);
export default MwasalatUser;
