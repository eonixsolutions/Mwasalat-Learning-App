import mongoose from 'mongoose';

const mwasalatMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatConversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    senderRole: { type: String, enum: ['learner', 'instructor'], required: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mwasalatMessageSchema.index({ conversation: 1, createdAt: 1 });

const MwasalatMessage = mongoose.model('MwasalatMessage', mwasalatMessageSchema);
export default MwasalatMessage;
