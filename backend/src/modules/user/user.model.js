import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../../constants/index.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    roles: {
      type: [{ type: String, enum: Object.values(ROLES) }],
      default: [ROLES.STUDENT],
    },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: null },

    // Email & account activation
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Branch assignment (for multi-branch support)
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },

    // Auth tokens
    refreshTokens: {
      type: [{ token: String, createdAt: { type: Date, default: Date.now } }],
      select: false,
    },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ roles: 1 });
userSchema.index({ branch: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
