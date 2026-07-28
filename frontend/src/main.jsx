import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/index.css';

import { queryClient } from './lib/queryClient.js';

// Registers the no-op-caching service worker so the app is installable
// (Add to Home Screen / desktop install) — see public/sw.js for why it's
// deliberately a pure network passthrough with no offline caching.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }}
      />
      {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} this was the bottom right icon, its TanStack React Query DevTools.It's a developer debugging tool that appears only in development mode. It lets you inspect: */} 
    </QueryClientProvider>
  </React.StrictMode>
);
