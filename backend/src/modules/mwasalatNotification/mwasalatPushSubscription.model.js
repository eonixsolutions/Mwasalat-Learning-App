import mongoose from 'mongoose';

// One document per browser/device the user has granted push permission on
// (a user can have several — phone + laptop, etc). `role` is denormalized
// from the user at subscribe time purely so admin broadcasts-by-role
// (see mwasalatWebPush.sendToRoles) can filter with a flat query instead of
// populating+joining every subscription back to its user on every send.
const mwasalatPushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'MwasalatUser', required: true, index: true },
    role: { type: String, required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

const MwasalatPushSubscription = mongoose.model('MwasalatPushSubscription', mwasalatPushSubscriptionSchema);
export default MwasalatPushSubscription;
