import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const TEAL = '#23181A';

// Line + area trend chart. `data` is a plain number[] (not {label,value} pairs) —
// callers map their own labeled series down to just the values.
export function TrendChart({ data, formatValue, height = 160 }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [hover, setHover] = useState(null);
  const max = Math.max(...data, 1);
  const min = 0;
  const w = 320, h = height, padL = 8, padR = 8, padB = 20, padT = 16;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const points = data.map((v, i) => {
    const x = padL + (i / (data.length - 1)) * plotW;
    const y = padT + plotH - ((v - min) / (max - min)) * plotH;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1][0]},${padT + plotH} L${points[0][0]},${padT + plotH} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} className="w-full h-auto" role="img" aria-label={t('charts.trendAriaLabel')}>
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={padL} x2={w - padR}
            y1={padT + plotH * (1 - t)} y2={padT + plotH * (1 - t)}
            stroke="#E2E8F0" strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill={TEAL} opacity="0.1" />
        <path d={linePath} fill="none" stroke={TEAL} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={x} cy={y} r="8" fill="transparent" />
            {(hover === i || i === points.length - 1) && (
              <>
                <circle cx={x} cy={y} r="4" fill={TEAL} stroke="#fff" strokeWidth="2" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">
                  {localizeNumber(formatValue ? formatValue(data[i]) : data[i], i18n.language)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// Horizontal bar chart. `data` is {label, value}[].
export function HBarChart({ data, formatValue = (v) => v, rowH = 34 }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 480, h = data.length * rowH, padL = 4, padR = 56, labelW = 150;
  const plotW = w - padL - padR - labelW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} className="w-full h-auto" role="img" aria-label={t('charts.topProgramsAriaLabel')}>
      {data.map((d, i) => {
        const barW = (d.value / max) * plotW;
        const y = i * rowH;
        const isHover = hover === i;
        return (
          <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
            <rect x={0} y={y} width={w} height={rowH - 6} fill="transparent" />
            <text x={padL} y={y + (rowH - 6) / 2} dominantBaseline="middle" fontSize="11" fill="#475569">
              {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
            </text>
            <rect
              x={labelW} y={y + 6} width={Math.max(barW, 3)} height={rowH - 18} rx="4"
              fill={TEAL} opacity={isHover ? 1 : 0.85}
            />
            <text
              x={labelW + Math.max(barW, 3) + 8} y={y + (rowH - 6) / 2}
              dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#1E293B"
            >
              {localizeNumber(formatValue(d.value), i18n.language)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart. `data` is {label, value}[] — category share breakdowns (churn
// risk, content-type mix). Same monochrome-ink treatment as the charts above,
// tiered by opacity per slice so it stays readable up to ~5 categories.
const DONUT_OPACITIES = [1, 0.75, 0.55, 0.4, 0.25];

// `colors` optionally overrides the single-ink opacity ramp with one fixed
// color per slice (e.g. green/amber/red for a completed/in-progress/at-risk
// gauge) — omit it to keep the original monochrome-ink treatment.
// `centerValue`/`centerLabel` render as a big stat inside the ring, turning
// this into a gauge (e.g. "82% Overall Completion") instead of a bare chart.
export function DonutChart({ data, formatValue = (v) => v, size = 160, colors, centerValue, centerLabel }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [hover, setHover] = useState(null);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2;
  const stroke = radius * 0.32;
  const innerRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const segment = {
      ...d,
      dash: fraction * circumference,
      offset,
      color: colors?.[i % colors.length] ?? TEAL,
      opacity: colors ? 1 : DONUT_OPACITIES[i % DONUT_OPACITIES.length],
    };
    offset += fraction * circumference;
    return segment;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ direction: 'ltr' }} role="img" aria-label={t('charts.donutAriaLabel')}>
          <g transform={`rotate(-90 ${radius} ${radius})`}>
            <circle cx={radius} cy={radius} r={innerRadius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
            {segments.map((s, i) => (
              <circle
                key={s.label}
                cx={radius} cy={radius} r={innerRadius}
                fill="none" stroke={s.color} strokeWidth={hover === i ? stroke + 4 : stroke}
                strokeOpacity={s.opacity}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'default', transition: 'stroke-width 0.15s' }}
              />
            ))}
          </g>
        </svg>
        {centerValue !== undefined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-[#1E293B]" dir="ltr">{centerValue}</p>
            {centerLabel && <p className="text-[10px] text-[#94A3B8] text-center px-3 leading-tight">{centerLabel}</p>}
          </div>
        )}
      </div>
      <div className="space-y-1.5 min-w-0">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-xs" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color, opacity: s.opacity }} />
            <span className="text-[#475569] truncate">{s.label}</span>
            <span className="text-[#1E293B] font-semibold ms-auto">{localizeNumber(formatValue(s.value), i18n.language)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// True funnel/pyramid shape — each stage narrower than the last, widest at
// the top. Unlike FunnelChart above (horizontal ranked bars), this reads as
// a literal funnel. `data` is {label, value}[], first entry = 100% width.
// Stages are an ordered progression (enrolled → started → finished), not
// unrelated categories, so the ramp reads gray (neutral entry point, nothing
// to flag yet) through amber (in motion) to green (done) — not a rainbow,
// and not red for the one stage that isn't actually a problem.
const FUNNEL_STAGE_COLORS = ['#94A3B8', '#F59E0B', '#22C55E'];

export function PyramidFunnelChart({ data, rowH = 46 }) {
  const { i18n } = useTranslation('mwasalatApp');
  const first = data[0]?.value || 1;
  const w = 200, h = data.length * rowH, maxBandW = w * 0.94, minBandW = maxBandW * 0.16;

  const widthFor = (value) => Math.max((value / first) * maxBandW, minBandW);

  return (
    <div className="flex items-center gap-4">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} className="flex-shrink-0">
        {data.map((d, i) => {
          const topW = widthFor(d.value);
          const bottomW = i === data.length - 1 ? Math.max(topW * 0.5, minBandW * 0.6) : widthFor(data[i + 1].value);
          const y = i * rowH;
          const topX1 = (w - topW) / 2, topX2 = (w + topW) / 2;
          const botX1 = (w - bottomW) / 2, botX2 = (w + bottomW) / 2;
          const points = `${topX1},${y} ${topX2},${y} ${botX2},${y + rowH - 3} ${botX1},${y + rowH - 3}`;
          return <polygon key={d.label} points={points} fill={FUNNEL_STAGE_COLORS[i % FUNNEL_STAGE_COLORS.length]} opacity={0.92} />;
        })}
      </svg>
      <div className="space-y-2.5 min-w-0 flex-1">
        {data.map((d, i) => {
          const pct = Math.round((d.value / first) * 100);
          return (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FUNNEL_STAGE_COLORS[i % FUNNEL_STAGE_COLORS.length] }} />
              <div className="min-w-0">
                <p className="text-[11px] text-[#475569] leading-snug">{d.label}</p>
                <p className="text-xs font-semibold text-[#1E293B]" dir="ltr">
                  {localizeNumber(d.value, i18n.language)}
                  {i > 0 && <span className="text-[#94A3B8] font-normal"> ({localizeNumber(pct, i18n.language)}%)</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Filled-area trend strip for a stat card's bottom edge — colored per caller,
// purely decorative context (no axes/labels/hover). Omit entirely when a
// metric has no real trend data behind it rather than faking one.
export function StatSparkline({ data, color = '#94A3B8', className = 'w-full h-11 block' }) {
  const points = data.slice(-12);
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const w = 160, h = 44, pad = 2;
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${h - pad} L${coords[0][0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={areaPath} fill={color} opacity="0.16" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Rounds a value up to a "nice" axis ceiling (1/2/5/10 × a power of ten) so
// gridlines land on readable numbers instead of the raw data max.
const niceCeil = (value) => {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
};

const formatCompact = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K` : `${Math.round(v)}`);

// Full-width labelled area chart (gridlines + K-scale y-axis, x-axis labels,
// peak-value badge) — the richer variant used where the surrounding card
// wants real axis context instead of a bare sparkline. X-axis labels thin
// out automatically past ~10 points so dense daily ranges don't overlap.
export function LabeledAreaChart({ points, color = '#D6293C' }) {
  const { i18n } = useTranslation('mwasalatApp');
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const axisMax = niceCeil(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => axisMax * f);

  const w = 560, h = 220, padL = 40, padR = 12, padT = 20, padB = 24;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const labelStride = Math.max(1, Math.ceil(points.length / 7));

  const coords = points.map((p, i) => {
    const x = padL + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
    const y = padT + plotH - (p.value / axisMax) * plotH;
    return [x, y];
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${padT + plotH} L${coords[0][0]},${padT + plotH} Z`;
  const maxIdx = values.indexOf(max);
  const [peakX, peakY] = coords[maxIdx] ?? [0, 0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} className="w-full h-auto">
      {ticks.map((tickValue) => {
        const y = padT + plotH - (tickValue / axisMax) * plotH;
        return (
          <g key={tickValue}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#F1F5F9" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94A3B8">{formatCompact(tickValue)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill={color} opacity="0.12" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={points[i].label} cx={x} cy={y} r={i === maxIdx ? 4 : 2.5} fill={color} stroke="#fff" strokeWidth="1.5" />
      ))}
      {points.map((p, i) => (
        (i % labelStride === 0 || i === points.length - 1) && (
          <text key={p.label} x={coords[i][0]} y={h - 4} textAnchor="middle" fontSize="10" fill="#94A3B8">{p.label}</text>
        )
      ))}
      {maxIdx >= 0 && (
        <g transform={`translate(${peakX}, ${Math.max(peakY - 24, 12)})`}>
          <rect x="-32" y="-11" width="64" height="20" rx="6" fill={color} />
          <text x="0" y="3" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
            {localizeNumber(max.toFixed(2), i18n.language)}
          </text>
        </g>
      )}
    </svg>
  );
}
