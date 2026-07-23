// Small icon/dot + two-line label chip for the admin header (date, last
// updated, users online). Hidden below `lg` — the header falls back to just
// title/subtitle + the icon row on narrow screens.
const TONE_BG = { red: 'bg-mwasalatRed-100', slate: 'bg-[#F1F5F9]', green: 'bg-[#F0FDF4]' };
const TONE_ICON = { red: 'text-mwasalatRed-600 bg-white', slate: 'text-[#475569] bg-white', green: 'text-green-600 bg-white' };

export default function MwasalatHeaderChip({ icon: Icon, dotColor, value, label, tone = 'slate' }) {
  return (
    <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl flex-shrink-0 ${TONE_BG[tone]}`}>
      {Icon && (
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TONE_ICON[tone]}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      )}
      {dotColor && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />}
      <div className="leading-tight min-w-0">
        <p className="text-xs font-semibold text-[#1E293B] truncate" dir="ltr">{value}</p>
        <p className="text-[10px] text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}
