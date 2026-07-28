import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, User, Star, X, Mail, Calendar, Wallet } from 'lucide-react';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';
import { getLocalizedProgramField, localizeNumber } from '../../utils/mwasalatLocalize.js';

export const PROGRAM_STATUS_STYLE = {
  active: { bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' },
  expired: { bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' },
  archived: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
  draft: { bg: 'bg-[#EDE9FE]', text: 'text-[#7C6AF2]' },
};

export function ProgramCard({ program, badge, delay = 0, onClick }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const theme = themeForCategory(program.category);
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);
  const status = PROGRAM_STATUS_STYLE[program.status] ?? PROGRAM_STATUS_STYLE.active;
  const statusKey = PROGRAM_STATUS_STYLE[program.status] ? program.status : 'active';
  // Every card in a status-filtered grid says "Active" — the delivery mode
  // (PDF / Recording / Live / ILT) is the more useful thing to scan for, so
  // it takes that badge's slot. Non-active statuses stay visible since
  // expired/archived/draft is exactly what the admin filter is watching for.
  const modeTypes = program.contentTypes ?? [];
  const modeLabel = modeTypes.length
    ? `${t(`addCourse.contentTypes.${modeTypes[0]}.label`)}${modeTypes.length > 1 ? ` +${modeTypes.length - 1}` : ''}`
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="card card-hover overflow-hidden flex flex-col mwasalat-enter relative cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      {badge && (
        <div className="absolute top-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 shadow-sm text-[#1E293B]">
          {badge}
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1 mb-1.5">
          {statusKey === 'active' && modeLabel ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#F1F5F9] text-[#475569]">
              {modeLabel}
            </span>
          ) : (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium ${status.bg} ${status.text}`}>
              {t(`programCard.status.${statusKey}`)}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium capitalize ${theme.bg} ${theme.text}`}>
            {category || t('programCard.generalCategory')}
          </span>
        </div>
        <h3 className="text-[13px] font-semibold text-[#1E293B] leading-snug mb-0.5 line-clamp-2">{title}</h3>
        {program.feedbackCount > 0 && (
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E293B] mb-1.5">
            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
            {localizeNumber(program.avgRating, i18n.language)} <span className="font-normal text-[#94A3B8]">({localizeNumber(program.feedbackCount, i18n.language)})</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-[11px] text-[#94A3B8] pt-2 border-t border-[#F1F5F9]">
          {program.instructor?._id ? (
            <Link
              to={`/admin/instructors/${program.instructor._id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 truncate hover:text-mwasalatInk-500 hover:underline transition-colors"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{program.instructor?.name || t('programCard.unassigned')}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{t('programCard.unassigned')}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" /> {duration || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProgramDetailModal({ program, onClose }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const theme = themeForCategory(program.category);
  const title = getLocalizedProgramField(program, 'title', i18n.language);
  const category = getLocalizedProgramField(program, 'category', i18n.language);
  const subCategory = getLocalizedProgramField(program, 'subCategory', i18n.language);
  const description = getLocalizedProgramField(program, 'description', i18n.language);
  const duration = getLocalizedProgramField(program, 'duration', i18n.language);
  const dateLocale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const status = PROGRAM_STATUS_STYLE[program.status] ?? PROGRAM_STATUS_STYLE.active;
  const statusKey = PROGRAM_STATUS_STYLE[program.status] ? program.status : 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                {t(`programCard.status.${statusKey}`)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${theme.bg} ${theme.text}`}>
                {category || t('programCard.generalCategory')}{subCategory ? ` · ${subCategory}` : ''}
              </span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-[#1E293B] mb-2">{title}</h3>
          {program.feedbackCount > 0 && (
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E293B] mb-3">
              <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
              {localizeNumber(program.avgRating, i18n.language)} <span className="font-normal text-[#94A3B8]">({t('programCard.reviewsCount', { count: program.feedbackCount })})</span>
            </p>
          )}
          {description && <p className="text-sm text-[#475569] leading-relaxed mb-4">{description}</p>}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(program.contentTypes ?? []).map((type) => (
              <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] capitalize">
                {t(`addCourse.contentTypes.${type}.label`)}
              </span>
            ))}
            {program.audience && program.audience !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
                {t(`addCourse.audience.${program.audience}.label`)}
              </span>
            )}
            {(program.departments ?? []).map((d) => (
              <span key={d._id ?? d} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
                {d.name ?? d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center gap-2 text-[#475569]">
              <Wallet className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
              {program.price > 0 ? <span dir="ltr">{`OMR ${localizeNumber(program.price.toFixed(2), i18n.language)}`}</span> : t('programCard.free')}
            </div>
            <div className="flex items-center gap-2 text-[#475569]">
              <Clock className="w-4 h-4 text-[#94A3B8] flex-shrink-0" /> {duration || '—'}
            </div>
            <div className="flex items-center gap-2 text-[#475569]">
              <Calendar className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
              {t('programCard.created')} <span dir="ltr">{localizeNumber(new Date(program.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}</span>
            </div>
            {program.expiryDate && (
              <div className="flex items-center gap-2 text-[#475569]">
                <Calendar className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                {t('programCard.expires')} <span dir="ltr">{localizeNumber(new Date(program.expiryDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-sm">
            {program.instructor?._id ? (
              <Link
                to={`/admin/instructors/${program.instructor._id}`}
                className="inline-flex items-center gap-2 text-[#1E293B] font-medium hover:text-mwasalatInk-500 hover:underline transition-colors"
              >
                <User className="w-4 h-4 text-[#94A3B8]" /> {program.instructor?.name || t('programCard.unassigned')}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 text-[#1E293B] font-medium">
                <User className="w-4 h-4 text-[#94A3B8]" /> {t('programCard.unassigned')}
              </span>
            )}
            {program.instructor?.email && (
              <span className="inline-flex items-center gap-2 text-[#94A3B8]" dir="ltr">
                <Mail className="w-4 h-4" /> {program.instructor.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
