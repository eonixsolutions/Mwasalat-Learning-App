import { AppError } from '../utils/AppError.js';

// Lightweight CSRF defense for the two endpoints authenticated purely by the
// httpOnly refresh-token cookie (refresh, logout) rather than a Bearer header.
// A cross-site page can get a browser to send a cookie-bearing request, but it
// cannot get the browser to attach this custom header without triggering a
// CORS preflight — and app.js's CORS config only allows the configured
// CLIENT_URL origin with credentials, so only same-origin XHR/fetch calls from
// the actual frontend can ever satisfy this check.
export const requireSpaHeader = (req, res, next) => {
  if (req.headers['x-mwasalat-client'] !== 'spa') {
    throw new AppError('This endpoint must be called from the Mwasalat web app', 403);
  }
  next();
};
