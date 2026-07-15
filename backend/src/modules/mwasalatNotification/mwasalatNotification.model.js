import mongoose from 'mongoose';

const mwasalatNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser' }],
    // Empty/absent = global broadcast (admin announcements, unchanged behavior).
    // Non-empty = targeted at just these users (e.g. learners enrolled in a
    // course that just got archived) — everyone else never sees it.
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser' }],
  },
  { timestamps: true }
);

mwasalatNotificationSchema.index({ createdAt: -1 });

const MwasalatNotification = mongoose.model('MwasalatNotification', mwasalatNotificationSchema);
export default MwasalatNotification;
