import mongoose from 'mongoose';

const installmentRecordSchema = new mongoose.Schema(
  {
    installmentNumber: { type: Number, required: true },
    label:             { type: String, default: '' },
    amount:            { type: Number, required: true },
    weeksAccess:       { type: Number, required: true },
    dueDate:           { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'due', 'submitted', 'paid', 'overdue', 'waived'],
      default: 'upcoming',
    },
    paymentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    paidAt:     { type: Date, default: null },
    reviewNote: { type: String, default: null },
  },
  { _id: false }
);

const feeAccountSchema = new mongoose.Schema(
  {
    student:              { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    course:               { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    feeStructure:         { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    totalFee:             { type: Number, required: true },
    currency:             { type: String, default: 'INR' },
    installments:         { type: [installmentRecordSchema], required: true },
    accessValidUntilWeek: { type: Number, default: 0 },
    totalPaid:            { type: Number, default: 0 },
    feeStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

feeAccountSchema.index({ student: 1 }, { unique: true });
feeAccountSchema.index({ feeStatus: 1 });
feeAccountSchema.index({ course: 1 });

const FeeAccount = mongoose.model('FeeAccount', feeAccountSchema);
export default FeeAccount;
