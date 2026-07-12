import mongoose from 'mongoose';

const installmentDefSchema = new mongoose.Schema(
  {
    installmentNumber: { type: Number, required: true },
    label:             { type: String, trim: true, default: '' },
    amount:            { type: Number, required: true, min: 0 },
    weeksAccess:       { type: Number, required: true, min: 0 },
    dueAfterDays:      { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    totalFee:     { type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'INR' },
    installments: { type: [installmentDefSchema], required: true },
    notes:        { type: String, trim: true, default: '' },
    isActive:     { type: Boolean, default: true },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

feeStructureSchema.index({ course: 1 }, { unique: true });
feeStructureSchema.index({ isActive: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
