import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_MWASALAT_GOOGLE_CLIENT_ID;

// Renders Google's official "Sign in with Google" button via Identity Services
// (script tag lives in index.html). Returns null if no client ID is configured
// so login/register pages keep working before OAuth is set up.
export default function MwasalatGoogleButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return undefined;

    let cancelled = false;
    let pollId;
    let timeoutId;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: Math.min(containerRef.current.offsetWidth || 320, 400),
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      pollId = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(pollId);
          render();
        }
      }, 200);
      timeoutId = setTimeout(() => {
        clearInterval(pollId);
        if (!cancelled && !window.google?.accounts?.id) {
          onError?.(new Error('Google Sign-In failed to load'));
        }
      }, 8000);
    }

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearTimeout(timeoutId);
    };
  }, [onCredential, onError]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className={`flex justify-center ${ready ? '' : 'h-10'}`} />;
}
