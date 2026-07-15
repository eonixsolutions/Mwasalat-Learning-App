import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Compass, BookOpen, GraduationCap, Flame, Trophy } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatEnrollmentCard from '../../components/mwasalat/MwasalatEnrollmentCard.jsx';
import MwasalatFlyingCar from '../../components/mwasalat/MwasalatFlyingCar.jsx';

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

export default function MwasalatLearnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState([]);
  const [completion, setCompletion] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [flight, setFlight] = useState(null);
  const { user } = useMwasalatAuthStore();

  const load = () => {
    setIsLoading(true);
    mwasalatProgramService.listMyEnrollments().then(async (e) => {
      setEnrollments(e);
      const entries = await Promise.all(
        e.map(async (enr) => [enr.program?._id, await mwasalatProgramService.getCompletionStatus(enr.program?._id)])
      );
      setCompletion(Object.fromEntries(entries));
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');

    if (purchase === 'success' && sessionId) {
      // Confirm the session ourselves instead of trusting the redirect alone —
      // this enrolls the learner immediately even if the Stripe webhook (which
      // needs `stripe listen` locally) hasn't fired yet.
      setSearchParams({}, { replace: true });
      mwasalatPaymentService.confirmSession(sessionId)
        .then(() => {
          toast.success('Payment successful — you\'re enrolled!');
          load();
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Could not confirm payment'));
    } else if (purchase === 'success') {
      toast.success('Payment successful — you\'re enrolled!');
      setSearchParams({}, { replace: true });
      load();
    } else if (purchase === 'cancelled') {
      toast('Checkout cancelled', { icon: 'ℹ️' });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // If we just came back from passing a quiz, fly a car from that course's
  // card to the points badge in the header. Runs once cards are on the page
  // so both endpoints of the flight actually exist in the DOM.
  useEffect(() => {
    if (isLoading) return;
    const raw = sessionStorage.getItem('mwasalat-fly-reward');
    if (!raw) return;
    sessionStorage.removeItem('mwasalat-fly-reward');

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const card = document.querySelector(`[data-card-id="${payload.programId}"]`);
    const badge = document.getElementById('mwasalat-points-badge');
    if (!card || !badge) return;

    const cardRect = card.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    setFlight({
      points: payload.points,
      from: { x: cardRect.left + cardRect.width / 2, y: cardRect.top + 24 },
      to: { x: badgeRect.left + badgeRect.width / 2, y: badgeRect.top + badgeRect.height / 2 },
    });
  }, [isLoading, enrollments]);

  const handleFlightDone = () => {
    if (flight) toast.success(`+${flight.points} points!`, { icon: '🚗' });
    setFlight(null);
    const badge = document.getElementById('mwasalat-points-badge');
    if (badge) {
      badge.classList.add('mwasalat-badge-pulse');
      setTimeout(() => badge.classList.remove('mwasalat-badge-pulse'), 500);
    }
  };

  const completedEnrollments = enrollments.filter((e) => completion[e.program?._id]?.certificateIssued);
  const inProgressEnrollments = enrollments.filter((e) => !completion[e.program?._id]?.certificateIssued);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <MwasalatLearnerLayout title="My Learning" subtitle="Your purchased and enrolled programs">
      {flight && <MwasalatFlyingCar from={flight.from} to={flight.to} onDone={handleFlightDone} />}

      {/* Welcome hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
        style={{ background: 'linear-gradient(120deg, #23181A 0%, #4A3336 55%, #8C6B6E 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-0.5">{firstName} 👋</h1>
          <p className="text-white/80 text-sm mt-2 max-w-md">
            {enrollments.length === 0
              ? 'Start your first program to begin earning points and certificates.'
              : `You're enrolled in ${enrollments.length} program${enrollments.length === 1 ? '' : 's'} — keep the momentum going.`}
          </p>
          <Link
            to="/mwasalat/learner/courses"
            className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm mt-4"
          >
            <Compass className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatTile icon={BookOpen} label="Enrolled" value={enrollments.length} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} />
        <StatTile icon={Flame} label="In Progress" value={inProgressEnrollments.length} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} />
        <Link to="/mwasalat/learner/completed">
          <StatTile icon={GraduationCap} label="Completed" value={completedEnrollments.length} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} />
        </Link>
        <StatTile icon={Trophy} label="Points" value={user?.points ?? 0} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} />
      </div>

      <h2 className="text-sm font-semibold text-[#1E293B] mb-3">In Progress</h2>

      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your courses…
        </div>
      ) : enrollments.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-mwasalatInk-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1E293B] mb-1.5">No courses yet</h2>
          <p className="text-sm text-[#475569] mb-5">Browse the catalog to find a training program to get started.</p>
          <Link
            to="/mwasalat/learner/courses"
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Compass className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      ) : inProgressEnrollments.length === 0 ? (
        <div className="card p-10 text-center">
          <GraduationCap className="w-8 h-8 text-[#22C55E] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#1E293B] mb-1">Everything's complete!</p>
          <Link to="/mwasalat/learner/completed" className="text-sm font-medium text-mwasalatInk-500 hover:underline">
            View your completed courses
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {inProgressEnrollments.map((e) => (
            <MwasalatEnrollmentCard key={e._id} enrollment={e} completion={completion[e.program?._id]} />
          ))}
        </div>
      )}
    </MwasalatLearnerLayout>
  );
}
