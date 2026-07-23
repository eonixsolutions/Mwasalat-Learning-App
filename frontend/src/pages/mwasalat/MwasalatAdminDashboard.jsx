import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, GraduationCap, BookOpen, Award, Loader2, Megaphone, Send, Wallet, ClipboardCheck,
  ArrowRight, FileBarChart, Trophy, UserPlus, ShieldCheck, Download, Settings, History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { PyramidFunnelChart, StatSparkline, LabeledAreaChart } from '../../components/mwasalat/MwasalatCharts.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { mwasalatPaymentService } from '../../services/mwasalatPayment.service.js';
import { mwasalatQuizService } from '../../services/mwasalatQuiz.service.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';
import { MWASALAT_ACTIVITY_ACTION_KEYS } from '../../utils/mwasalatActivityLabels.js';

function SendNotificationModal({ onClose }) {
  const { t } = useTranslation('mwasalatApp');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t('adminDashboard.notifyModal.validationError'));
      return;
    }
    setIsSending(true);
    try {
      await mwasalatNotificationService.send({ title: title.trim(), message: message.trim() });
      toast.success(t('adminDashboard.notifyModal.sentToast'));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminDashboard.notifyModal.sendFailed'));
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
        <h3 className="text-base font-bold text-[#1E293B] mb-1">{t('adminDashboard.notifyModal.title')}</h3>
        <p className="text-sm text-[#475569] mb-4">
          {t('adminDashboard.notifyModal.body')}
        </p>

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminDashboard.notifyModal.titleLabel')}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('adminDashboard.notifyModal.titlePlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors mb-4"
        />

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminDashboard.notifyModal.messageLabel')}</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('adminDashboard.notifyModal.messagePlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors resize-none"
        />

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? t('adminDashboard.notifyModal.sending') : t('adminDashboard.notifyModal.sendButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

const TEAL = '#23181A';

// Colored variants for the top stat cards / month-summary tiles — the only
// place this dashboard departs from the app's usual single-ink chart color,
// since these are discrete unrelated metrics (revenue/learners/programs/
// certificates), not one ordered series.
const STAT_THEMES = {
  red: { iconBg: 'bg-mwasalatRed-500', spark: '#D6293C', softBg: 'bg-mwasalatRed-100' },
  amber: { iconBg: 'bg-amber-400', spark: '#F59E0B', softBg: 'bg-amber-50' },
  purple: { iconBg: 'bg-[#7C6AF2]', spark: '#7C6AF2', softBg: 'bg-[#F3E8FF]' },
  green: { iconBg: 'bg-[#22C55E]', spark: '#22C55E', softBg: 'bg-green-50' },
  blue: { iconBg: 'bg-blue-500', spark: '#3B82F6', softBg: 'bg-blue-50' },
  ink: { iconBg: 'bg-mwasalatInk-500', spark: '#23181A', softBg: 'bg-mwasalatInk-100' },
};

function StatCard({ icon: Icon, theme, label, value, delta, deltaTone = 'positive', sparkline, to }) {
  const th = STAT_THEMES[theme];
  return (
    <Link to={to} className="card overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer">
      <div className="p-4 pb-2 flex-1">
        <div className="flex items-center gap-2.5 mb-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${th.iconBg}`}>
            <Icon className="w-4 h-4 text-white" />
          </span>
          <p className="text-xs text-[#475569]">{label}</p>
        </div>
        <p className="text-xl font-bold text-[#1E293B] leading-tight" dir="ltr">{value}</p>
        {delta && (
          <p className={`text-[11px] font-medium mt-1 ${deltaTone === 'positive' ? 'text-green-600' : 'text-[#94A3B8]'}`}>
            {delta}
          </p>
        )}
      </div>
      {sparkline?.length > 1 && <StatSparkline data={sparkline} color={th.spark} />}
    </Link>
  );
}

// Vertical bar chart — used for both "New Learners" (red, always-visible
// value labels) and the existing "Programs by Delivery Type" panel (ink,
// hover-only labels), via the `color`/`showValues` props.
function BarChart({ data, height = 160, color = TEAL, showValues = false }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 320, h = height, padL = 8, padR = 8, padB = 24, padT = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const slot = plotW / data.length;
  const barW = Math.min(24, slot * 0.4);
  const gap = 2;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} className="w-full h-auto" role="img" aria-label={t('adminDashboard.charts.deliveryTypeAriaLabel')}>
        {[0, 0.5, 1].map((tick) => (
          <line
            key={tick}
            x1={padL} x2={w - padR}
            y1={padT + plotH * (1 - tick)} y2={padT + plotH * (1 - tick)}
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
                fill={color}
                opacity={isHover ? 1 : 0.85}
              />
              <text
                x={x + barW / 2} y={h - 6}
                textAnchor="middle" fontSize="9" fill="#94A3B8"
              >
                {d.label}
              </text>
              {(showValues || isHover) && (
                <text
                  x={x + barW / 2} y={y - 6}
                  textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B"
                >
                  {localizeNumber(d.value, i18n.language)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Thin card shell shared by every chart tile in the left column — keeps the
// title/subtitle treatment identical without repeating the markup six times.
function ChartCard({ title, subtitle, badge, children }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">{title}</p>
          <p className="text-xs text-[#94A3B8] mb-2">{subtitle}</p>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// Label above a full-width fill bar, value at the end of the label line —
// deliberately not a single-line "label · mini-bar · value" row, since that
// forces long program names into a sliver of space and clips them. Wrapping
// the label to its own line means it never truncates, at any card width.
function MiniBarRow({ label, value, max, formatValue = (v) => v, barColor = 'bg-mwasalatInk-500' }) {
  const { i18n } = useTranslation('mwasalatApp');
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="text-xs text-[#475569] leading-snug">{label}</p>
        <p className="text-xs font-semibold text-[#1E293B] flex-shrink-0" dir="ltr">
          {localizeNumber(formatValue(value), i18n.language)}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Compact "just now / 5m ago" formatter — same convention as
// MwasalatNotificationBell's local timeAgo, duplicated rather than shared
// since it's a few lines and each caller already owns its own t()/i18n.
function useTimeAgo() {
  const { t, i18n } = useTranslation('mwasalatApp');
  return (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return t('common.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return localizeNumber(t('common.minutesAgo', { count: minutes }), i18n.language);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return localizeNumber(t('common.hoursAgo', { count: hours }), i18n.language);
    const days = Math.floor(hours / 24);
    return localizeNumber(t('common.daysAgo', { count: days }), i18n.language);
  };
}

// Icon/color per feed-item type — real event types only (see
// getRecentActivityFeed in mwasalatProgram.service.js): enrollments,
// completions, and certificates issued are merged with the admin activity
// log server-side, not fabricated client-side.
const ACTIVITY_TYPE_STYLE = {
  enrolled: { Icon: UserPlus, bg: 'bg-mwasalatRed-100', color: 'text-mwasalatRed-600' },
  completed: { Icon: ShieldCheck, bg: 'bg-green-50', color: 'text-green-600' },
  certificate: { Icon: Award, bg: 'bg-amber-50', color: 'text-amber-600' },
};
const ADMIN_ACTION_STYLE = {
  invite_instructor: { Icon: GraduationCap, bg: 'bg-[#F3E8FF]', color: 'text-[#7C6AF2]' },
  send_notification: { Icon: Megaphone, bg: 'bg-blue-50', color: 'text-blue-600' },
  block_user: { Icon: Users, bg: 'bg-mwasalatRed-100', color: 'text-mwasalatRed-600' },
  unblock_user: { Icon: Users, bg: 'bg-green-50', color: 'text-green-600' },
  create_program: { Icon: BookOpen, bg: 'bg-mwasalatInk-100', color: 'text-mwasalatInk-500' },
  update_program: { Icon: BookOpen, bg: 'bg-mwasalatInk-100', color: 'text-mwasalatInk-500' },
  delete_program: { Icon: BookOpen, bg: 'bg-mwasalatRed-100', color: 'text-mwasalatRed-600' },
  update_settings: { Icon: Settings, bg: 'bg-mwasalatInk-100', color: 'text-mwasalatInk-500' },
};
const DEFAULT_ACTIVITY_STYLE = { Icon: History, bg: 'bg-[#F1F5F9]', color: 'text-[#94A3B8]' };

function ActivityFeedItem({ item }) {
  const { t } = useTranslation('mwasalatApp');
  const timeAgo = useTimeAgo();

  let style = DEFAULT_ACTIVITY_STYLE;
  let text;
  if (item.type === 'admin') {
    style = ADMIN_ACTION_STYLE[item.action] ?? DEFAULT_ACTIVITY_STYLE;
    const actionKey = MWASALAT_ACTIVITY_ACTION_KEYS[item.action];
    const actionLabel = actionKey ? t(`activityLogPage.actions.${actionKey}`) : item.action;
    text = (
      <>
        <span className="font-medium">{item.actorName ?? t('activityLogPage.unknownActor')}</span>{' '}
        <span className="text-[#475569]">{actionLabel.toLowerCase()}</span>
        {(item.metadata?.title || item.metadata?.targetName) && (
          <span className="text-[#475569]"> — {item.metadata.title ?? item.metadata.targetName}</span>
        )}
      </>
    );
  } else {
    style = ACTIVITY_TYPE_STYLE[item.type] ?? DEFAULT_ACTIVITY_STYLE;
    const i18nKey = item.type === 'enrolled' ? 'feedEnrolled' : item.type === 'completed' ? 'feedCompleted' : 'feedCertificate';
    text = t(`adminDashboard.activity.${i18nKey}`, {
      learner: item.learner ?? t('adminDashboard.untitledProgram'),
      program: item.program ?? t('adminDashboard.untitledProgram'),
    });
  }

  const { Icon, bg, color } = style;
  return (
    <li className="flex items-start gap-2.5">
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#1E293B] leading-snug">{text}</p>
        <p className="text-[10px] text-[#94A3B8] mt-0.5">{timeAgo(item.at)}</p>
      </div>
    </li>
  );
}

function TodaysActivitiesCard({ items }) {
  const { t } = useTranslation('mwasalatApp');
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">{t('adminDashboard.activity.title')}</p>
          <p className="text-xs text-[#94A3B8]">{t('adminDashboard.activity.subtitle')}</p>
        </div>
        <Link to="/mwasalat/admin/activity-log" className="inline-flex items-center gap-0.5 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors flex-shrink-0">
          {t('adminDashboard.activity.viewAll')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[#94A3B8] py-6 text-center">{t('adminDashboard.activity.empty')}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, i) => <ActivityFeedItem key={`${item.type}-${item.at}-${i}`} item={item} />)}
        </ul>
      )}
    </div>
  );
}

function UpcomingClassesCard({ classes }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-semibold text-[#1E293B]">{t('adminDashboard.upcomingClasses.title')}</p>
        <Link to="/mwasalat/admin/programs?view=classes" className="inline-flex items-center gap-0.5 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors flex-shrink-0">
          {t('adminDashboard.upcomingClasses.viewAll')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>
      {classes.length === 0 ? (
        <p className="text-xs text-[#94A3B8] py-6 text-center">{t('adminDashboard.upcomingClasses.empty')}</p>
      ) : (
        <ul className="space-y-2.5">
          {classes.map((c) => {
            const date = new Date(c.scheduledAt);
            return (
              <li key={c.programId} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-mwasalatRed-100 flex flex-col items-center justify-center flex-shrink-0 text-mwasalatRed-600">
                  <p className="text-sm font-bold leading-none" dir="ltr">{localizeNumber(date.getDate(), i18n.language)}</p>
                  <p className="text-[9px] font-semibold uppercase leading-none mt-0.5">{date.toLocaleDateString(dateLocale, { month: 'short' })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1E293B] truncate">{getLocalizedProgramField(c, 'title', i18n.language)}</p>
                  <p className="text-[10px] text-[#94A3B8]" dir="ltr">
                    {localizeNumber(date.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' }), i18n.language)}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] truncate">{c.instructor}</p>
                </div>
                <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                  {t('adminDashboard.upcomingClasses.enrolled', { count: c.enrolledCount })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MonthSummaryGrid({ items, title }) {
  return (
    <div className="card p-3.5">
      <p className="text-sm font-semibold text-[#1E293B] mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map(({ icon: Icon, theme, label, value, delta }) => (
          <div key={label} className={`rounded-xl p-3 ${STAT_THEMES[theme].softBg}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${STAT_THEMES[theme].iconBg}`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </span>
            <p className="text-sm font-bold text-[#1E293B]" dir="ltr">{value}</p>
            <p className="text-[10px] text-[#94A3B8]">{label}</p>
            {delta && <p className="text-[10px] font-medium text-green-600 mt-0.5">{delta}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentPaymentsCard({ transactions }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  const handleExportCsv = () => {
    const header = ['Date', 'Learner', 'Program', 'Amount', 'Currency', 'Status'];
    const rows = transactions.map((tx) => [
      new Date(tx.paidAt).toISOString().slice(0, 10),
      tx.learner?.name ?? '',
      tx.program?.title ?? '',
      tx.amount.toFixed(2),
      tx.currency,
      tx.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwasalat-recent-payments.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-3.5 pb-2">
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">{t('adminDashboard.recentPayments.title')}</p>
          <p className="text-xs text-[#94A3B8]">{t('adminDashboard.recentPayments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/mwasalat/admin/payments" className="inline-flex items-center gap-0.5 text-xs font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors">
            {t('adminDashboard.recentPayments.viewAll')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              aria-label={t('adminDashboard.recentPayments.exportCsv')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {transactions.length === 0 ? (
        <p className="text-xs text-[#94A3B8] py-6 text-center">{t('adminDashboard.recentPayments.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] text-start text-[10px] text-[#94A3B8] uppercase tracking-wide">
                <th className="px-3.5 py-2 font-semibold border-y border-[#E2E8F0] text-start">{t('common.date')}</th>
                <th className="px-3.5 py-2 font-semibold border-y border-[#E2E8F0] text-start">{t('common.name')}</th>
                <th className="px-3.5 py-2 font-semibold border-y border-[#E2E8F0] text-start">{t('admin.nav.programs')}</th>
                <th className="px-3.5 py-2 font-semibold border-y border-[#E2E8F0] text-end">{t('paymentsPage.columns.amount')}</th>
                <th className="px-3.5 py-2 font-semibold border-y border-[#E2E8F0] text-start">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB]/70 transition-colors">
                  <td className="px-3.5 py-2 align-middle text-[#475569]" dir="ltr">
                    {localizeNumber(new Date(tx.paidAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
                  </td>
                  <td className="px-3.5 py-2 align-middle font-medium text-[#1E293B] truncate max-w-[160px]">{tx.learner?.name}</td>
                  <td className="px-3.5 py-2 align-middle text-[#475569] truncate max-w-[160px]">
                    {getLocalizedProgramField(tx.program, 'title', i18n.language)}
                  </td>
                  <td className="px-3.5 py-2 align-middle text-end font-semibold text-[#1E293B]" dir="ltr">
                    {tx.currency} {localizeNumber(tx.amount.toFixed(2), i18n.language)}
                  </td>
                  <td className="px-3.5 py-2 align-middle">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      tx.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-[#FBE7E9] text-mwasalatRed-600'
                    }`}>
                      {tx.status === 'paid' ? t('paymentsPage.statusPaid') : t('paymentsPage.statusRefunded')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
};

export default function MwasalatAdminDashboard() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [topProgramsTab, setTopProgramsTab] = useState('revenue');

  useEffect(() => {
    Promise.all([
      mwasalatProgramService.getAdminOverview(),
      mwasalatPaymentService.getRevenueSummary(),
      mwasalatQuizService.getAdminResults(),
      mwasalatProgramService.getRecentActivityFeed(8),
      mwasalatPaymentService.listTransactions({ page: 1, limit: 6 }),
      mwasalatProgramService.getTopCoursesByCompletionRate(),
      mwasalatProgramService.getUpcomingClasses(),
    ])
      .then(([overviewData, revenueData, quizData, feedData, transactionsData, topCoursesData, upcomingData]) => {
        setOverview(overviewData);
        setRevenue(revenueData);
        setQuizResults(quizData);
        setActivityFeed(feedData);
        setTransactions(transactionsData.transactions);
        setTopCourses(topCoursesData);
        setUpcomingClasses(upcomingData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthAttempts = (quizResults?.attempts ?? []).filter((a) => new Date(a.attemptedAt) >= monthStart);
  const thisMonthPassRate = thisMonthAttempts.length
    ? Math.round((thisMonthAttempts.filter((a) => a.passed).length / thisMonthAttempts.length) * 100)
    : null;

  const topProgramsByPassRate = [...(quizResults?.programResults ?? [])]
    .sort((a, b) => b.passRate - a.passRate)
    .slice(0, 5)
    .map((p) => ({ label: getLocalizedProgramField(p.program, 'title', i18n.language) || t('adminDashboard.untitledProgram'), value: p.passRate }));

  const topProgramsByRevenue = (revenue?.topProgramsByRevenue ?? [])
    .map((p) => ({ label: getLocalizedProgramField(p.program, 'title', i18n.language) || t('adminDashboard.untitledProgram'), value: p.revenue }));
  const maxRevenueProgram = Math.max(...topProgramsByRevenue.map((p) => p.value), 1);
  const maxPassRateProgram = Math.max(...topProgramsByPassRate.map((p) => p.value), 1);

  const topCourseRows = topCourses.map((c) => ({
    label: getLocalizedProgramField(c, 'title', i18n.language) || t('adminDashboard.untitledProgram'),
    value: c.completionRate,
  }));
  const maxTopCourseRate = Math.max(...topCourseRows.map((c) => c.value), 1);

  const monthlyRevenueValues = revenue?.monthlyRevenue?.map((m) => m.value) ?? [];
  const lastMonthRevenue = monthlyRevenueValues[monthlyRevenueValues.length - 2] ?? 0;
  const thisMonthRevenueValue = monthlyRevenueValues[monthlyRevenueValues.length - 1] ?? 0;
  const revenueGrowthPct = lastMonthRevenue ? Math.round(((thisMonthRevenueValue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  const learnersThisWeek = overview?.weeklySignups?.[overview.weeklySignups.length - 1] ?? 0;

  const statCards = [
    {
      icon: Wallet, theme: 'red', label: t('adminDashboard.stats.totalRevenue'),
      value: `OMR ${localizeNumber((revenue?.totalRevenue ?? 0).toFixed(2), i18n.language)}`,
      delta: revenueGrowthPct !== null ? `${revenueGrowthPct >= 0 ? '+' : ''}${localizeNumber(revenueGrowthPct, i18n.language)}% ${t('adminDashboard.stats.thisMonth')}` : null,
      sparkline: revenue?.monthlyRevenue?.map((m) => m.value),
      to: '/mwasalat/admin/payments',
    },
    {
      icon: Users, theme: 'amber', label: t('adminDashboard.stats.totalLearners'),
      value: localizeNumber(overview?.totalLearners ?? 0, i18n.language),
      delta: `+${localizeNumber(learnersThisWeek, i18n.language)} ${t('adminDashboard.stats.thisWeek')}`,
      sparkline: overview?.weeklySignups,
      to: '/mwasalat/admin/learners',
    },
    {
      icon: BookOpen, theme: 'purple', label: t('adminDashboard.stats.activePrograms'),
      value: localizeNumber(overview?.activePrograms ?? 0, i18n.language),
      delta: t('adminDashboard.stats.draftPrograms', { count: overview?.draftPrograms ?? 0 }),
      deltaTone: 'neutral',
      to: '/mwasalat/admin/programs',
    },
    {
      icon: Award, theme: 'green', label: t('adminDashboard.stats.certificatesIssued'),
      value: localizeNumber(overview?.totalCertificates ?? 0, i18n.language),
      delta: `+${localizeNumber(overview?.certificatesIssuedToday ?? 0, i18n.language)} ${t('adminDashboard.stats.issuedToday')}`,
      sparkline: overview?.weeklyCertificates,
      to: '/mwasalat/admin/certificates',
    },
    {
      icon: GraduationCap, theme: 'blue', label: t('adminDashboard.stats.instructors'),
      value: localizeNumber(overview?.totalInstructors ?? 0, i18n.language),
      to: '/mwasalat/admin/instructors',
    },
  ];

  const monthSummaryItems = [
    {
      icon: Wallet, theme: 'red', label: t('adminDashboard.stats.totalRevenue'),
      value: `OMR ${localizeNumber((revenue?.thisMonthRevenue ?? 0).toFixed(2), i18n.language)}`,
      delta: revenueGrowthPct !== null ? `${revenueGrowthPct >= 0 ? '+' : ''}${localizeNumber(revenueGrowthPct, i18n.language)}%` : null,
    },
    {
      icon: Users, theme: 'green', label: t('adminDashboard.stats.totalLearners'),
      value: localizeNumber(overview?.newLearnersThisMonth ?? 0, i18n.language),
      delta: `+${localizeNumber(overview?.newLearnersThisMonth ?? 0, i18n.language)}`,
    },
    {
      icon: Award, theme: 'blue', label: t('adminDashboard.stats.certificatesIssued'),
      value: localizeNumber(overview?.certificatesIssuedThisMonth ?? 0, i18n.language),
      delta: `+${localizeNumber(overview?.certificatesIssuedThisMonth ?? 0, i18n.language)}`,
    },
    {
      icon: ClipboardCheck, theme: 'purple', label: t('adminDashboard.stats.avgQuizPassRate'),
      value: thisMonthPassRate !== null ? `${localizeNumber(thisMonthPassRate, i18n.language)}%` : '—',
    },
  ];

  return (
    <MwasalatAdminLayout
      title={t(`adminDashboard.greetings.${getGreetingKey()}`, { name: user?.name ?? t('adminDashboard.defaultAdminName') })}
      subtitle={t('adminDashboard.subtitle')}
    >
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('adminDashboard.loadingOverview')}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2.5 mb-4">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-xs"
            >
              <Megaphone className="w-3.5 h-3.5" /> {t('adminDashboard.notifyModal.title')}
            </button>
            <Link
              to="/mwasalat/admin/sales-report"
              className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F8F9FB] text-[#1E293B] font-semibold px-4 py-2.5 rounded-xl transition-colors text-xs"
            >
              <FileBarChart className="w-3.5 h-3.5" /> {t('adminDashboard.generateReport')}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>

          {/* Dense 2/3 + 1/3 split: charts + recent payments on the left, a
              live "what's happening / how healthy is it" rail on the right —
              so more of the platform fits above the fold on wide screens
              instead of stacking everything in one column. */}
          <div className="grid xl:grid-cols-3 gap-3.5 items-start">
            <div className="xl:col-span-2 space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <ChartCard
                  title={t('adminDashboard.charts.monthlyRevenueTitle')}
                  subtitle={t('adminDashboard.charts.monthlyRevenueSubtitle')}
                  badge={<span className="text-[10px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-lg flex-shrink-0">OMR</span>}
                >
                  <LabeledAreaChart
                    points={(revenue?.monthlyRevenue ?? []).map((m) => ({ label: m.label, value: m.value }))}
                  />
                </ChartCard>
                <ChartCard
                  title={t('adminDashboard.charts.weeklyLearnersTitle')}
                  subtitle={t('adminDashboard.charts.weeklyLearnersSubtitle')}
                >
                  {overview?.weeklySignups?.length ? (
                    <BarChart
                      data={overview.weeklySignups.map((value, i) => ({ label: t('adminDashboard.charts.weekLabel', { number: i + 1 }), value }))}
                      height={160}
                      color="#D6293C"
                      showValues
                    />
                  ) : (
                    <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noEnrollments')}</p>
                  )}
                </ChartCard>
              </div>

              <div className="grid lg:grid-cols-2 gap-3.5">
                <ChartCard title={t('adminDashboard.charts.funnelTitle')} subtitle={t('adminDashboard.charts.funnelSubtitle')}>
                  {overview?.funnel?.[0]?.value ? (
                    <PyramidFunnelChart data={overview.funnel} rowH={40} />
                  ) : (
                    <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noEnrollments')}</p>
                  )}
                </ChartCard>

                <ChartCard
                  title={t('adminDashboard.charts.topPerformingCoursesTitle')}
                  subtitle={t('adminDashboard.charts.topPerformingCoursesSubtitle')}
                  badge={(
                    <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </span>
                  )}
                >
                  {topCourseRows.length ? (
                    <div className="space-y-2.5 pt-1">
                      {topCourseRows.map((c) => (
                        <MiniBarRow key={c.label} label={c.label} value={c.value} max={maxTopCourseRate} formatValue={(v) => `${v}%`} barColor="bg-mwasalatRed-500" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noEnrollments')}</p>
                  )}
                </ChartCard>
              </div>

              {/* Revenue and pass-rate used to be two near-identical ranked
                  lists side by side — same shape, half the width each, so
                  program names clipped. One card with a tab switch keeps
                  both metrics one click away and gives the ranking itself
                  the full column to breathe. */}
              <div className="grid lg:grid-cols-2 gap-3.5">
                <ChartCard
                  title={t('adminDashboard.charts.topProgramsTitle')}
                  subtitle={topProgramsTab === 'revenue' ? t('adminDashboard.charts.topRevenueSubtitle') : t('adminDashboard.charts.topPassRateSubtitle')}
                  badge={(
                    <div className="inline-flex items-center gap-0.5 bg-[#F1F5F9] rounded-lg p-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTopProgramsTab('revenue')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                          topProgramsTab === 'revenue' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#94A3B8] hover:text-[#475569]'
                        }`}
                      >
                        {t('adminDashboard.charts.topProgramsTabRevenue')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopProgramsTab('passRate')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                          topProgramsTab === 'passRate' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#94A3B8] hover:text-[#475569]'
                        }`}
                      >
                        {t('adminDashboard.charts.topProgramsTabPassRate')}
                      </button>
                    </div>
                  )}
                >
                  {topProgramsTab === 'revenue' ? (
                    topProgramsByRevenue.length ? (
                      <div className="space-y-3.5 pt-1">
                        {topProgramsByRevenue.map((p) => (
                          <MiniBarRow key={p.label} label={p.label} value={p.value} max={maxRevenueProgram} formatValue={(v) => v.toFixed(0)} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noPaidEnrollments')}</p>
                    )
                  ) : (
                    topProgramsByPassRate.length ? (
                      <div className="space-y-3.5 pt-1">
                        {topProgramsByPassRate.map((p) => (
                          <MiniBarRow key={p.label} label={p.label} value={p.value} max={maxPassRateProgram} formatValue={(v) => `${v}%`} barColor="bg-mwasalatRed-500" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noQuizAttempts')}</p>
                    )
                  )}
                </ChartCard>

                <ChartCard title={t('adminDashboard.charts.deliveryTypeTitle')} subtitle={t('adminDashboard.charts.deliveryTypeSubtitle')}>
                  {overview?.programsByType?.length > 0 ? (
                    <BarChart data={overview.programsByType} height={140} showValues />
                  ) : (
                    <p className="text-sm text-[#94A3B8] py-6 text-center">{t('adminDashboard.charts.noPrograms')}</p>
                  )}
                </ChartCard>
              </div>

              <RecentPaymentsCard transactions={transactions} />
            </div>

            <div className="space-y-3.5">
              <TodaysActivitiesCard items={activityFeed} />
              <UpcomingClassesCard classes={upcomingClasses} />
              <MonthSummaryGrid items={monthSummaryItems} title={t('adminDashboard.monthSummary.title')} />
            </div>
          </div>
        </>
      )}

      {showNotifyModal && <SendNotificationModal onClose={() => setShowNotifyModal(false)} />}
    </MwasalatAdminLayout>
  );
}
