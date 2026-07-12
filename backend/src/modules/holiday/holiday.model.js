import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['public', 'custom'], default: 'custom' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1, branch: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
