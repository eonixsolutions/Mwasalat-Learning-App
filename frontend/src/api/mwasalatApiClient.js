import axios from 'axios';
import toast from 'react-hot-toast';
import { useMwasalatAuthStore } from '../store/mwasalatAuthStore.js';

// Custom header the backend's requireSpaHeader middleware checks on the
// cookie-authenticated refresh/logout endpoints — see
// backend/src/middlewares/csrfHeaderGuard.js for why this is a valid CSRF
// defense (a cross-site page can't get this header attached to a credentialed
// request without a CORS preflight our API would reject).
const SPA_HEADER = { 'X-Mwasalat-Client': 'spa' };

// Separate, non-intercepted instance for the refresh call itself — reusing the
// main `api` instance here would recurse back into the same 401 handler below.
const refreshClient = axios.create({
  baseURL: '/api/mwasalat-auth',
  withCredentials: true,
  headers: SPA_HEADER,
});

// Concurrent 401s (e.g. a dashboard firing several requests at once right as
// the access token expires) must all await the *same* refresh call rather
// than each racing to rotate the refresh token — only the first one actually
// refreshes; the rest piggyback on its in-flight promise.
let refreshPromise = null;
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/refresh')
      .then((res) => {
        const { accessToken, user, isNewUser } = res.data.data;
        useMwasalatAuthStore.getState().setAuth(user, accessToken, isNewUser);
        return accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const forceLogout = () => {
  useMwasalatAuthStore.getState().logout();
  refreshClient.post('/logout').catch(() => {});
  toast.error('Your session has expired. Please sign in again.');
  window.location.href = '/';
};

export const createMwasalatApi = (baseURL) => {
  const api = axios.create({ baseURL, withCredentials: true, headers: SPA_HEADER });

  api.interceptors.request.use((config) => {
    const token = useMwasalatAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { config, response } = error;
      const isAuthed = useMwasalatAuthStore.getState().isAuthenticated;

      if (response?.status === 401 && isAuthed && !config?._retriedAfterRefresh) {
        config._retriedAfterRefresh = true;
        try {
          const accessToken = await refreshAccessToken();
          config.headers.Authorization = `Bearer ${accessToken}`;
          return api(config);
        } catch {
          forceLogout();
          return Promise.reject(error);
        }
      }

      if (response?.status === 401 && isAuthed) {
        forceLogout();
      }

      return Promise.reject(error);
    }
  );

  return api;
};
