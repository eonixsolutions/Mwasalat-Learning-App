import mongoose from 'mongoose';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';

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
    // Audience filter for admin broadcasts (recipients is empty for those).
    // Empty/absent = every role sees it. Non-empty = only users whose role
    // is in this list — e.g. a "students only" announcement stays out of
    // the instructor notification bell.
    roles: [{ type: String, enum: Object.values(MWASALAT_ROLES) }],
    // Absent on every notification created before this field existed (schema
    // additions don't backfill) — those all predate the reminders feature, so
    // they're outside the 'certificate_expiry'/'inactivity_nudge' filter the
    // admin Reminders page uses and simply won't show up there, which is correct.
    type: {
      type: String,
      enum: [
        'broadcast', 'instructor', 'certificate_expiry', 'inactivity_nudge', 'assignment_graded',
        'chat_message', 'admin_chat_message',
      ],
      default: 'broadcast',
    },
    // Deep-link payload for click-through types (chat_message / admin_chat_message)
    // — shape depends on type, resolved into a route client-side.
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

mwasalatNotificationSchema.index({ createdAt: -1 });
mwasalatNotificationSchema.index({ type: 1, createdAt: -1 });

const MwasalatNotification = mongoose.model('MwasalatNotification', mwasalatNotificationSchema);
export default MwasalatNotification;
