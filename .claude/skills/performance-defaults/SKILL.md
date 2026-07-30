---
name: performance-defaults
description: "Checklist of performance defaults for this app's dashboards, list pages, and role layouts — lazy-loaded routes, batched queries, indexed hot fields, bulk endpoints instead of N+1, persistent layout shells, TanStack Query caching, and lean()/aggregation on the backend. Use when building a new dashboard/list page or role layout, or when asked to review existing ones for performance."
---

# Performance Defaults

A reusable checklist distilled from a real fix (2026-07-29) for a "dashboard and pages take too long to open" complaint in the Mwasalat module. That investigation found the slowness came from several independent, avoidable patterns — not one bug. Apply these by default on new work; don't wait for a slowness complaint to check for them.

## When to apply

- Building a new dashboard, list page, or admin/report view.
- Adding a new role layout (sidebar + header shared across a set of pages).
- Adding a page that needs per-item status/detail for a list of things (completion status, progress, etc.).
- Asked to review a page or endpoint for performance, or asked "why is X slow?".

## The checklist

1. **Lazy-load the route.** New entries in `frontend/src/routes/AppRoutes.jsx` must be `const X = lazy(() => import('...'))`, not a static top-level import. One page added the eager way quietly grows the shared bundle for every role.

2. **Batch parallel queries into one round-trip.** If a page/endpoint fires more than one independent async call, they belong in a single `Promise.all([...])`, not several `Promise.all` blocks run one after another (each sequential block is a full extra round-trip). If a data source is conditional (e.g. role-gated), use `condition ? fetchIt() : Promise.resolve(null)` inside the *same* array rather than a separate `await` before/after.

3. **Never fetch per item in a loop — client or server.** If a page needs status/progress/detail for N items (enrolled courses, roster rows, etc.), there must be a bulk endpoint taking `ids: [...]` (Mongo `$in`) and returning a map keyed by id, not N sequential single-item calls. Look for `.map(async (x) => await someService.getX(x.id))` — that's the smell.

4. **Index hot-path fields up front.** Any field used in a `.find()`/`$match` filter or a `.sort()` on an endpoint that a dashboard hits needs a matching index in the model file, following that model's existing `.index({...})` style — don't wait until the collection is large enough to notice.

5. **Persistent layout shell, not per-page-remounted layout**, for any role dashboard with a sidebar + header + polling/bell/notification chrome. Pattern used in this repo: split `MwasalatXLayout` into
   - a thin wrapper (`MwasalatXLayout.jsx`) that keeps the exact same `{title, subtitle, actions, children}` signature every page already calls, and pushes that header content into a shared `zustand` store (`store/mwasalatLayoutHeaderStore.js`) via `useLayoutEffect` (not `useEffect` — avoids a one-frame flash of the previous page's title),
   - and the actual chrome (`MwasalatXLayoutShell.jsx`), mounted once via nested `<Route element={<MwasalatXLayoutShell/>}>...child routes...</Route>` in `AppRoutes.jsx`, containing `<Suspense fallback={<MwasalatPageAreaSpinner/>}><Outlet/></Suspense>` where the page used to render.
   Without this, every nav click re-fires online-count polls, "refresh my profile" calls, and notification/chat-bell fetches — because the whole layout (and its `useEffect`s) unmounted and remounted on every page.

6. **TanStack Query for dashboard data fetching, not raw `useEffect` + `useState` + axios.** `lib/queryClient.js` already sets a 5-minute `staleTime` — that setting only does something if the page actually calls `useQuery`. Give each independent data source its own `queryKey`, or one combined query if the sources are only ever used together (matches how this project's admin/learner dashboards are wired).

7. **Backend: `.lean()` + field projection on read-only queries; aggregation instead of full-collection-fetch-then-JS-reduce.** A `Model.find(...)` whose result is only read (never `.save()`d) should end in `.lean()`. A query whose response never touches a heavy embedded field (e.g. `modules[].lessons[]`) should `.select('-modules')`. Anything that pulls a whole collection to sum/group/count in JavaScript (e.g. "all-time revenue") should be a `$group`/`$facet` aggregation instead — it gets slower every day otherwise.

## If asked to review existing code against this list

Read the relevant page/layout/endpoint, check it against each item above, and report concrete findings (file:line, what's wrong, what it should be instead) — same bar as a real code review, not generic advice. Don't apply fixes unless asked to; a review pass and an implementation pass are different requests.

## Full case study

For the complete before/after reasoning (root-cause investigation, the exact aggregation rewrites, the Shell/Outlet migration order, and the live Playwright verification that proved it worked), see project memory: `performance_defaults.md` and the conversation it was distilled from.
