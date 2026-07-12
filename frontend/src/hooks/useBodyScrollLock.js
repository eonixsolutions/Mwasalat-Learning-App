import { useEffect } from 'react';

// Pass active=true (default) to lock, false to skip locking.
// Always called unconditionally so it's safe before early returns.
export default function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
