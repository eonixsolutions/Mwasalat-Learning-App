import mongoose from 'mongoose';

// Flat sender/recipient messages rather than a separate conversation doc —
// unlike mwasalatChat (which is per-course, learner+instructor scoped), an
// admin pair has no course to key a conversation on, so "thread with user X"
// is just every message between the two of us.
const mwasalatAdminMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mwasalatAdminMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
mwasalatAdminMessageSchema.index({ recipient: 1, read: 1 });

const MwasalatAdminMessage = mongoose.model('MwasalatAdminMessage', mwasalatAdminMessageSchema);
export default MwasalatAdminMessage;
