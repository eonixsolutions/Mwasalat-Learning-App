import Spinner from '../ui/Spinner.jsx';

// Suspense fallback for the <Outlet/> content area inside a persistent
// layout shell — unlike MwasalatRouteLoader (full-viewport, first paint),
// this only replaces the main content area while navigating to a page whose
// chunk hasn't downloaded yet, so the sidebar/header/bells stay mounted.
export default function MwasalatPageAreaSpinner() {
  return (
    <div className="p-10 flex items-center justify-center text-[#94A3B8]">
      <Spinner className="w-5 h-5 text-mwasalatRed-500" />
    </div>
  );
}
