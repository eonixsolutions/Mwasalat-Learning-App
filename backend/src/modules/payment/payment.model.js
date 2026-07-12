import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student:         { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type:            { type: String, enum: ['registration_fee', 'course_fee'], required: true },
    amount:          { type: Number, required: true },
    currency:        { type: String, default: 'inr' },
    status:          { type: String, enum: ['pending_review', 'approved', 'rejected'], default: 'pending_review' },
    receiptUrl:      { type: String, required: true },
    receiptPublicId: { type: String, required: true },
    paymentMethod:   { type: String, enum: ['upi', 'bank_transfer', 'cash', 'other'], required: true },
    transactionId:   { type: String, trim: true, default: '' },
    studentNote:     { type: String, trim: true, default: '' },
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote:      { type: String, trim: true, default: '' },
    reviewedAt:        { type: Date, default: null },
    paidAt:            { type: Date, default: null },
    // Fee installment link (null for registration_fee payments)
    feeAccount:        { type: mongoose.Schema.Types.ObjectId, ref: 'FeeAccount', default: null },
    installmentNumber: { type: Number, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
