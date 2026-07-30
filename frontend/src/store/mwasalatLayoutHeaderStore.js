import { create } from 'zustand';

// Lets the thin per-page MwasalatXLayout wrapper (title/subtitle/actions
// props) hand its header content up to the persistent MwasalatXLayoutShell
// that now renders the actual header bar — the Shell mounts once per
// session via <Outlet/>, so props can no longer flow from page to chrome
// through JSX nesting the way they used to when each page wrapped itself in
// the full layout. Only one role's Shell is ever mounted at a time, so a
// single shared store (rather than one per role) is enough.
export const useMwasalatLayoutHeaderStore = create((set) => ({
  title: null,
  subtitle: null,
  actions: null,
  setHeader: (header) => set(header),
  resetHeader: () => set({ title: null, subtitle: null, actions: null }),
}));
