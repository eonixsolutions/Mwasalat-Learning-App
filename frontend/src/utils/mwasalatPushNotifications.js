import { mwasalatNotificationService } from '../services/mwasalatNotification.service.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_MWASALAT_VAPID_PUBLIC_KEY;

// PushManager.subscribe needs the VAPID key as a Uint8Array, but env vars
// and the backend both hand it over base64url-encoded — this is the
// standard conversion (see MDN's Push API guide).
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const isPushSupported = () =>
  Boolean(VAPID_PUBLIC_KEY) && 'serviceWorker' in navigator && 'PushManager' in window;

// Resolves the current subscription state without prompting — used to decide
// whether to show the "enable notifications" banner at all.
export const getPushSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

// Requests Notification permission (must be called from a user gesture) and,
// if granted, subscribes with the push service and registers the
// subscription with the backend so it can target this device later.
export const subscribeToPush = async () => {
  if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted');

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  await mwasalatNotificationService.subscribePush(subscription.toJSON());
  return subscription;
};

export const unsubscribeFromPush = async () => {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await subscription.unsubscribe();
  await mwasalatNotificationService.unsubscribePush(subscription.endpoint).catch(() => {});
};
