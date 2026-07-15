import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Award, Loader2, Megaphone, Send, Wallet, ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { TrendChart, HBarChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';

function SendNotificationModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setIsSending(true);
    try {
      await mwasalatNotificationService.send({ title: title.trim(), message: message.trim() });
      toast.success('Notification sent to everyone');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
          <Megaphone className="w-5 h-5 text-mwasalatInk-500" />
        </div>
        <h3 className="text-base font-bold text-[#1E293B] mb-1">Send Notification</h3>
        <p className="text-sm text-[#475569] mb-4">
          Every learner and instructor currently on the platform gets this instantly.
        </p>

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Scheduled maintenance tonight"
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors mb-4"
        />

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Message</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What do they need to know?"
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? 'Sending…' : 'Send to Everyone'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TEAL = '#23181A';

function BarChart({ data }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 320, h = 160, padL = 8, padR = 8, padB = 24, padT = 12;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const slot = plotW / data.length;
  const barW = Math.min(24, slot * 0.4);
  const gap = 2;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Programs by delivery type">
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={padL} x2={w - padR}
            y1={padT + plotH * (1 - t)} y2={padT + plotH * (1 - t)}
            stroke="#E2E8F0" strokeWidth="1"
          />
        ))}
        {data.map((d, i) => {
          const barH = (d.value / max) * plotH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + plotH - barH;
          const isHover = hover === i;
          return (
            <g key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={x} y={padT} width={barW} height={plotH} fill="transparent" />
              <rect
                x={x + gap / 2}
                y={y}
                width={barW - gap}
                height={Math.max(barH - gap, 0)}
                rx="4"
                fill={TEAL}
                opacity={isHover ? 1 : 0.85}
              />
              <text
                x={x + barW / 2} y={h - 6}
                textAnchor="middle" fontSize="9" fill="#94A3B8"
              >
                {d.label}
              </text>
              {isHover && (
                <text
                  x={x + barW / 2} y={y - 6}
                  textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B"
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Compact 12-point trend for a stat tile — de-emphasis gray line, last point
// in the teal accent. Purely decorative context, no axes/labels/hover.
function Sparkline({ data }) {
  const points = data.slice(-12);
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const w = 64, h = 20, pad = 2;
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-5 flex-shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={TEAL} />
    </svg>
  );
}

// A single ratio against a limit (0-100) — a radial ring, not a bare number.
// Fill and track share the same teal ramp so state reads at a glance.
function Meter({ value, size = 40 }) {
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F6EFEF" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TEAL} strokeWidth="4"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.28} fontWeight="700" fill="#1E293B">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// Horizontal bars — used when category labels (program titles) are long,
// per the form guidance for many/long-named categories.
// Part-to-whole progression — decreasing bar width shows where learners drop
// off between enrolling and finishing a course. Single hue, sequential by
// position (not by magnitude), each stage direct-labeled with its % of stage 1.
function FunnelChart({ data }) {
  const first = data[0]?.value || 1;
  const rowH = 40;
  const w = 640, h = data.length * rowH, padL = 4, padR = 90, labelW = 140;
  const plotW = w - padL - padR - labelW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Enrollment completion funnel">
      {data.map((d, i) => {
        const barW = (d.value / first) * plotW;
        const y = i * rowH;
        const pct = Math.round((d.value / first) * 100);
        return (
          <g key={d.label}>
            <text x={padL} y={y + (rowH - 8) / 2} dominantBaseline="middle" fontSize="12" fill="#475569">
              {d.label}
            </text>
            <rect x={labelW} y={y + 6} width={Math.max(barW, 3)} height={rowH - 20} rx="4" fill={TEAL} opacity={0.85} />
            <text
              x={labelW + Math.max(barW, 3) + 10} y={y + (rowH - 8) / 2}
              dominantBaseline="middle" fontSize="12" fontWeight="600" fill="#1E293B"
            >
              {d.value} {i > 0 && <tspan fill="#94A3B8" fontWeight="400">({pct}%)</tspan>}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function MwasalatAdminDashboard() {
  const { user } = useMwasalatAuthStore();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.getAdminOverview(),
      mwasalatPaymentService.getRevenueSummary(),
      mwasalatQuizService.getAdminResults(),
    ])
      .then(([overviewData, revenueData, quizData]) => {
        setOverview(overviewData);
        setRevenue(revenueData);
        setQuizResults(quizData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const overallPassRate = quizResults?.programResults?.length
    ? Math.round(
      quizResults.programResults.reduce((sum, p) => sum + p.passRate, 0) / quizResults.programResults.length
    )
    : null;

  const topProgramsByPassRate = [...(quizResults?.programResults ?? [])]
    .sort((a, b) => b.passRate - a.passRate)
    .slice(0, 5)
    .map((p) => ({ label: p.program?.title ?? 'Untitled program', value: p.passRate }));

  const topProgramsByRevenue = (revenue?.topProgramsByRevenue ?? [])
    .map((p) => ({ label: p.program?.title ?? 'Untitled program', value: p.revenue }));

  const stats = [
    {
      icon: Wallet, label: 'Total Revenue', value: `OMR ${(revenue?.totalRevenue ?? 0).toFixed(2)}`, to: '/mwasalat/admin/payments',
      sparkline: revenue?.monthlyRevenue?.map((m) => m.value),
    },
    {
      icon: Users, label: 'Total Learners', value: overview?.totalLearners ?? 0, to: '/mwasalat/admin/learners',
      sparkline: overview?.weeklySignups,
    },
    { icon: GraduationCap, label: 'Instructors', value: overview?.totalInstructors ?? 0, to: '/mwasalat/admin/instructors' },
    { icon: BookOpen, label: 'Active Programs', value: overview?.activePrograms ?? 0, to: '/mwasalat/admin/programs' },
    { icon: Award, label: 'Certificates Issued', value: overview?.totalCertificates ?? 0, to: '/mwasalat/admin/certificates' },
    { icon: ClipboardCheck, label: 'Avg Quiz Pass Rate', to: '/mwasalat/admin/quiz-results', meter: overallPassRate },
  ];

  return (
    <MwasalatAdminLayout
      title={`Welcome back, ${user?.name ?? 'Admin'}`}
      subtitle="Here's how the platform is doing."
      actions={(
        <button
          onClick={() => setShowNotifyModal(true)}
          className="hidden sm:inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
        >
          <Megaphone className="w-3.5 h-3.5" /> Send Notification
        </button>
      )}
    >
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading overview…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {stats.map(({ icon: Icon, label, value, to, sparkline, meter }) => (
              <Link
                key={label}
                to={to}
                className="card p-3.5 flex flex-col gap-2 hover:shadow-md hover:border-mwasalatInk-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-7 h-7 rounded-lg bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-mwasalatInk-500" />
                  </div>
                  {sparkline?.length > 1 && <Sparkline data={sparkline} />}
                  {meter !== undefined && <Meter value={meter ?? 0} size={36} />}
                </div>
                {meter === undefined && <p className="text-lg font-semibold text-[#1E293B] leading-tight">{value}</p>}
                <p className="text-xs text-[#475569] leading-snug">{label}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Monthly Revenue</p>
              <p className="text-xs text-[#94A3B8] mb-2">Last 6 months, OMR</p>
              <TrendChart
                data={revenue?.monthlyRevenue?.map((m) => m.value) ?? [0, 0, 0, 0, 0, 0]}
                formatValue={(v) => v.toFixed(0)}
              />
            </div>
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Weekly New Learners</p>
              <p className="text-xs text-[#94A3B8] mb-2">Signups over the last 8 weeks</p>
              <TrendChart data={overview?.weeklySignups ?? [0, 0, 0, 0, 0, 0, 0, 0]} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Enrollment Funnel</p>
              <p className="text-xs text-[#94A3B8] mb-2">Where learners drop off between enrolling and finishing a course</p>
              {overview?.funnel?.[0]?.value ? (
                <FunnelChart data={overview.funnel} />
              ) : (
                <p className="text-sm text-[#94A3B8] py-10 text-center">No enrollments yet.</p>
              )}
            </div>
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Programs by Delivery Type</p>
              <p className="text-xs text-[#94A3B8] mb-2">Across all active and draft programs</p>
              {overview?.programsByType?.length ? (
                <BarChart data={overview.programsByType} />
              ) : (
                <p className="text-sm text-[#94A3B8] py-10 text-center">No programs yet.</p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Top Programs by Revenue</p>
              <p className="text-xs text-[#94A3B8] mb-2">Highest-earning courses, OMR</p>
              {topProgramsByRevenue.length ? (
                <HBarChart data={topProgramsByRevenue} formatValue={(v) => v.toFixed(2)} />
              ) : (
                <p className="text-sm text-[#94A3B8] py-10 text-center">No paid enrollments yet.</p>
              )}
            </div>
            <div className="card p-5">
              <p className="text-sm font-semibold text-[#1E293B]">Top Programs by Pass Rate</p>
              <p className="text-xs text-[#94A3B8] mb-2">Best-performing courses in assessments</p>
              {topProgramsByPassRate.length ? (
                <HBarChart data={topProgramsByPassRate} formatValue={(v) => `${v}%`} />
              ) : (
                <p className="text-sm text-[#94A3B8] py-10 text-center">No quiz attempts yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {showNotifyModal && <SendNotificationModal onClose={() => setShowNotifyModal(false)} />}
    </MwasalatAdminLayout>
  );
}
