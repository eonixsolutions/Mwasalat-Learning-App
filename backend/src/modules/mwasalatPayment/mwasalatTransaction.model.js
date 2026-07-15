import mongoose from 'mongoose';

const mwasalatTransactionSchema = new mongoose.Schema(
  {
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatProgram', required: true },
    amount: { type: Number, required: true }, // OMR
    currency: { type: String, default: 'OMR' },
    stripeSessionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

mwasalatTransactionSchema.index({ paidAt: -1 });
mwasalatTransactionSchema.index({ program: 1 });

const MwasalatTransaction = mongoose.model('MwasalatTransaction', mwasalatTransactionSchema);
export default MwasalatTransaction;
