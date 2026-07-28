import webpush from 'web-push';
import logger from '../utils/logger.js';
import MwasalatPushSubscription from '../modules/mwasalatNotification/mwasalatPushSubscription.model.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
const webPushReady = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);

if (webPushReady) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn('[webPush] VAPID keys not configured — browser push notifications are disabled.');
}

// Best-effort delivery to one subscription. A 404/410 means the browser
// revoked or expired that subscription (uninstalled, cleared site data,
// permission reset) — that's expected steady-state churn, not a failure, so
// it's cleaned up silently instead of logged as an error.
const deliver = async (subscription, payload) => {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      JSON.stringify(payload)
    );
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await MwasalatPushSubscription.deleteOne({ _id: subscription._id });
    } else {
      logger.error(`[webPush] Delivery failed for subscription ${subscription._id}: ${err.message}`);
    }
  }
};

// Fire-and-forget by design — push is a best-effort supplementary channel on
// top of the in-app/socket notification, so a slow or failing push service
// must never delay or fail the notification write it's attached to.
export const sendPushToUserIds = (userIds, payload) => {
  if (!webPushReady || !userIds?.length) return;
  MwasalatPushSubscription.find({ user: { $in: userIds } })
    .then((subs) => Promise.all(subs.map((sub) => deliver(sub, payload))))
    .catch((err) => logger.error(`[webPush] sendPushToUserIds lookup failed: ${err.message}`));
};

// Empty/absent roles = every role (mirrors mwasalatNotification's broadcast
// semantics — see VISIBLE_TO in mwasalatNotification.service.js).
export const sendPushToRoles = (roles, payload) => {
  if (!webPushReady) return;
  const filter = roles?.length ? { role: { $in: roles } } : {};
  MwasalatPushSubscription.find(filter)
    .then((subs) => Promise.all(subs.map((sub) => deliver(sub, payload))))
    .catch((err) => logger.error(`[webPush] sendPushToRoles lookup failed: ${err.message}`));
};

export const upsertPushSubscription = async (userId, role, subscription, userAgent) => {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid push subscription payload');
  }
  await MwasalatPushSubscription.findOneAndUpdate(
    { endpoint },
    { user: userId, role, endpoint, keys, userAgent },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const removePushSubscription = async (endpoint) => {
  if (!endpoint) return;
  await MwasalatPushSubscription.deleteOne({ endpoint });
};

export const isWebPushConfigured = () => webPushReady;
