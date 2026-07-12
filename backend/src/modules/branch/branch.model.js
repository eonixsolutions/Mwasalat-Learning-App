import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, unique: true, trim: true },
    code:     { type: String, required: true, unique: true, uppercase: true, trim: true },
    location: { type: String, trim: true, default: null },
    address:  { type: String, trim: true, default: null },
    phone:    { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ isActive: 1 });

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
