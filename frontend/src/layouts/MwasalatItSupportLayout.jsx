import { useLayoutEffect } from 'react';
import { useMwasalatLayoutHeaderStore } from '../store/mwasalatLayoutHeaderStore.js';

// Thin per-page wrapper — every IT Support page still calls this with the
// exact same props it always has (title/subtitle/actions/children), so no
// page file needed to change. The actual sidebar/header chrome now lives in
// MwasalatItSupportLayoutShell, mounted once per session at the route
// level; this just hands the current page's header content up to that
// persistent Shell. useLayoutEffect (not useEffect) so the new page's title
// is in the store before the browser paints — no one-frame flash of the
// previous title.
export default function MwasalatItSupportLayout({ title, subtitle, actions, children }) {
  const setHeader = useMwasalatLayoutHeaderStore((s) => s.setHeader);
  const resetHeader = useMwasalatLayoutHeaderStore((s) => s.resetHeader);

  useLayoutEffect(() => {
    setHeader({ title, subtitle, actions });
    return () => resetHeader();
  }, [title, subtitle, actions, setHeader, resetHeader]);

  return <>{children}</>;
}
