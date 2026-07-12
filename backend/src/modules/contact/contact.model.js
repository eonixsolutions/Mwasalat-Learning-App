import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    contact:     { type: String, required: true, trim: true },
    message:     { type: String, required: true, trim: true },
    status:      { type: String, enum: ['open', 'closed'], default: 'open' },
    notes:       { type: String, trim: true, default: '' },
    handledBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    handledAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const ContactInquiry = mongoose.model('ContactInquiry', contactSchema);
export default ContactInquiry;
