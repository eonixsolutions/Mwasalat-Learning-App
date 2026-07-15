import { Link } from 'react-router-dom';
import { Clock, User, Star, X, Mail, Calendar, Wallet } from 'lucide-react';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';

export const PROGRAM_STATUS_STYLE = {
  active: { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500', label: 'Active' },
  expired: { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600', label: 'Expired' },
  archived: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', label: 'Archived' },
  draft: { bg: 'bg-[#EDE9FE]', text: 'text-[#7C6AF2]', label: 'Draft' },
};

export function ProgramCard({ program, badge, delay = 0, onClick }) {
  const theme = themeForCategory(program.category);
  const status = PROGRAM_STATUS_STYLE[program.status] ?? PROGRAM_STATUS_STYLE.active;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="card card-hover overflow-hidden flex flex-col mwasalat-enter relative cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
      {badge && (
        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 shadow-sm text-[#1E293B]">
          {badge}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${theme.bg} ${theme.text}`}>
            {program.category || 'General'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[#1E293B] leading-snug mb-1 line-clamp-2">{program.title}</h3>
        {program.feedbackCount > 0 && (
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E293B] mb-2">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            {program.avgRating} <span className="font-normal text-[#94A3B8]">({program.feedbackCount})</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-[#94A3B8] pt-2.5 border-t border-[#F1F5F9]">
          {program.instructor?._id ? (
            <Link
              to={`/mwasalat/admin/instructors/${program.instructor._id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 truncate hover:text-mwasalatInk-500 hover:underline transition-colors"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{program.instructor?.name || 'Unassigned'}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">Unassigned</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" /> {program.duration || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProgramDetailModal({ program, onClose }) {
  const theme = themeForCategory(program.category);
  const status = PROGRAM_STATUS_STYLE[program.status] ?? PROGRAM_STATUS_STYLE.active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${theme.solid}, ${theme.solid}99)` }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${theme.bg} ${theme.text}`}>
                {program.category || 'General'}{program.subCategory ? ` · ${program.subCategory}` : ''}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-[#1E293B] mb-2">{program.title}</h3>
          {program.feedbackCount > 0 && (
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E293B] mb-3">
              <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
              {program.avgRating} <span className="font-normal text-[#94A3B8]">({program.feedbackCount} review{program.feedbackCount === 1 ? '' : 's'})</span>
            </p>
          )}
          {program.description && <p className="text-sm text-[#475569] leading-relaxed mb-4">{program.description}</p>}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(program.contentTypes ?? []).map((type) => (
              <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] capitalize">
                {type}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center gap-2 text-[#475569]">
              <Wallet className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> {program.price > 0 ? `OMR ${program.price.toFixed(2)}` : 'Free'}
            </div>
            <div className="flex items-center gap-2 text-[#475569]">
              <Clock className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> {program.duration || '—'}
            </div>
            <div className="flex items-center gap-2 text-[#475569]">
              <Calendar className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> Created {new Date(program.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {program.expiryDate && (
              <div className="flex items-center gap-2 text-[#475569]">
                <Calendar className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> Expires {new Date(program.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-sm">
            {program.instructor?._id ? (
              <Link
                to={`/mwasalat/admin/instructors/${program.instructor._id}`}
                className="inline-flex items-center gap-2 text-[#1E293B] font-medium hover:text-mwasalatInk-500 hover:underline transition-colors"
              >
                <User className="w-4 h-4 text-[#94A3B8]" /> {program.instructor?.name || 'Unassigned'}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 text-[#1E293B] font-medium">
                <User className="w-4 h-4 text-[#94A3B8]" /> Unassigned
              </span>
            )}
            {program.instructor?.email && (
              <span className="inline-flex items-center gap-2 text-[#94A3B8]">
                <Mail className="w-4 h-4" /> {program.instructor.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
