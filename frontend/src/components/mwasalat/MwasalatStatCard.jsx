import { useTranslation } from 'react-i18next';
import { StatSparkline } from './MwasalatCharts.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// Icon top-left + compact sparkline top-right, value/sub below, delta
// bottom-right — shared by the Payments and Sales Report pages so their stat
// rows look identical instead of two near-duplicate implementations drifting
// apart over time.
export default function MwasalatStatCard({ icon: Icon, iconBg, sparkColor, label, value, sub, delta, deltaLabel, sparkline }) {
  const { i18n } = useTranslation('mwasalatApp');
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </span>
        {sparkline?.length > 1 && (
          <div className="w-20 h-8 flex-shrink-0">
            <StatSparkline data={sparkline} color={sparkColor} className="w-full h-full block" />
          </div>
        )}
      </div>
      <p className="text-sm text-[#475569] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1E293B]" dir="ltr">{value}</p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <p className="text-xs text-[#94A3B8]">{sub}</p>
        {delta !== null && delta !== undefined && (
          <p className={`text-xs font-medium flex-shrink-0 ${delta >= 0 ? 'text-green-600' : 'text-mwasalatRed-600'}`} dir="ltr">
            {delta >= 0 ? '↑' : '↓'} {delta >= 0 ? '+' : ''}{localizeNumber(delta, i18n.language)}% {deltaLabel}
          </p>
        )}
      </div>
    </div>
  );
}
