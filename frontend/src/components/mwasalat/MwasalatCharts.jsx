import { useState } from 'react';

const TEAL = '#23181A';

// Line + area trend chart. `data` is a plain number[] (not {label,value} pairs) —
// callers map their own labeled series down to just the values.
export function TrendChart({ data, formatValue }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data, 1);
  const min = 0;
  const w = 320, h = 160, padL = 8, padR = 8, padB = 20, padT = 16;
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
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Trend">
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
                  {formatValue ? formatValue(data[i]) : data[i]}
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
export function HBarChart({ data, formatValue = (v) => v }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = 34;
  const w = 480, h = data.length * rowH, padL = 4, padR = 56, labelW = 150;
  const plotW = w - padL - padR - labelW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Top programs">
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
              {formatValue(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
