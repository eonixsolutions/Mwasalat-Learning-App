import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = import.meta.env.VITE_MWASALAT_GA_MEASUREMENT_ID;

// Loads Google Analytics (gtag.js) and fires an SPA page_view on every route
// change. Returns null and does nothing if no measurement ID is configured,
// same convention as MwasalatGoogleButton for optional third-party integrations.
export default function MwasalatAnalytics() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!MEASUREMENT_ID || initialized.current) return;
    initialized.current = true;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
  }, []);

  useEffect(() => {
    if (!MEASUREMENT_ID || !window.gtag) return;
    window.gtag('event', 'page_view', {
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
    });
  }, [location]);

  return null;
}
