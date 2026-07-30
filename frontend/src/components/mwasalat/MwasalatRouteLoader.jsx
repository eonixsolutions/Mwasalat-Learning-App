import Spinner from '../ui/Spinner.jsx';

// Suspense fallback shown while a lazy-loaded route chunk downloads — covers
// everything from the first paint (login/landing) through in-app navigation
// to a page whose chunk hasn't been fetched yet.
export default function MwasalatRouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
      <Spinner className="w-8 h-8 text-mwasalatRed-500" />
    </div>
  );
}
