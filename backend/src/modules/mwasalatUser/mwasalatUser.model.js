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
    passwordResetOtp: { type: String, select: false },
    passwordResetOtpExpiry: { type: Date, select: false },
    passwordResetOtpAttempts: { type: Number, default: 0, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false, default: [] },
    lastLogin: { type: Date },
    consentAcceptedAt: { type: Date },
    // Department-Based Access — non-super-admin queries are scoped to this
    // (see mwasalatDepartmentScope.js). Null means "unassigned" (super_admin
    // and most existing accounts predating this field).
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatDepartment', default: null },
    // Supervisor-to-Employee Mapping — the line manager who approves this
    // learner's enrollments/completions (see mwasalatProgram.service.js).
    // Only meaningful when role is learner/external_learner.
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', default: null },
    // Account Lockout Policy — cleared on any successful login (see mwasalatAuth.service.js).
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
    // Password Expiry Policy — set on every password change via the pre-save hook below,
    // so invite-set/OTP-reset/change-password all feed the same expiry clock for free.
    passwordChangedAt: { type: Date, default: Date.now, select: false },
    // Bumped whenever the password changes — embedded in every refresh token issued.
    // A refresh token whose tokenVersion doesn't match the current value is rejected,
    // so changing your password invalidates every other device's refresh token too.
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

mwasalatUserSchema.index({ isActive: 1 });
mwasalatUserSchema.index({ role: 1 });
mwasalatUserSchema.index({ department: 1 });

mwasalatUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  next();
});

mwasalatUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

mwasalatUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // These are select:false, but any query that explicitly re-selects them
  // (2FA setup/verify flows) must never let them leak into an API response.
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  return obj;
};

const MwasalatUser = mongoose.model('MwasalatUser', mwasalatUserSchema);
export default MwasalatUser;
