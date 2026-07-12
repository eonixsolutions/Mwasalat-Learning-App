import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, required: true },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    data:      { type: mongoose.Schema.Types.Mixed, default: null },
    isRead:     { type: Boolean, default: false },
    readAt:     { type: Date, default: null },
    targetRole: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, targetRole: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
