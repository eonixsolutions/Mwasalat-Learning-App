import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ban, CheckCircle2, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import MwasalatBlockUserModal from './MwasalatBlockUserModal.jsx';
import { TABLE_PAGE_SIZE_OPTIONS } from './MwasalatDataTable.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

function SortableHeader({ label, active, direction, onClick, className = '' }) {
  return (
    <th className={`px-5 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-[#1E293B] transition-colors"
      >
        {label}
        {active && (direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}

export default function MwasalatUserTable({ users, isLoading, pendingId, onToggle, onMessage, emptyLabel, linkTo, columns, readOnly = false }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [blockTarget, setBlockTarget] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_OPTIONS[0]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sortedUsers = useMemo(() => {
    if (!sortKey) return users;
    const dir = sortDir === 'asc' ? 1 : -1;
    const extraCol = columns?.find((c) => c.key === sortKey);
    return [...users].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'name') { aVal = a.name ?? ''; bVal = b.name ?? ''; }
      else if (sortKey === 'joined') { aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); }
      else if (extraCol) { aVal = extraCol.sortValue?.(a) ?? -1; bVal = extraCol.sortValue?.(b) ?? -1; }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [users, sortKey, sortDir, columns]);

  const pages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleConfirmBlock = async (reason) => {
    await onToggle(blockTarget, reason);
    setBlockTarget(null);
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('dataTable.loading')}
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="p-10 text-center text-[#94A3B8] text-sm">{emptyLabel}</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-start text-xs text-[#94A3B8] uppercase tracking-wide">
              <SortableHeader label={t('common.name')} active={sortKey === 'name'} direction={sortDir} onClick={() => toggleSort('name')} />
              {columns ? (
                columns.map((col) => (
                  <SortableHeader key={col.key} label={col.label} active={sortKey === col.key} direction={sortDir} onClick={() => toggleSort(col.key)} />
                ))
              ) : (
                <th className="px-5 py-3 font-medium">{t('common.email')}</th>
              )}
              <th className="px-5 py-3 font-medium">{t('common.status')}</th>
              <SortableHeader label={t('userTable.joined')} active={sortKey === 'joined'} direction={sortDir} onClick={() => toggleSort('joined')} />
              {(!readOnly || onMessage) && <th className="px-5 py-3 font-medium text-end">{t('userTable.action')}</th>}
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((u) => (
              <tr key={u._id} className="border-b border-[#F1F5F9] last:border-0">
                <td className="px-5 py-3.5 font-medium text-[#1E293B] whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    {linkTo ? (
                      <Link to={linkTo(u)} className="hover:text-mwasalatInk-500 hover:underline transition-colors">
                        {u.name}
                      </Link>
                    ) : (
                      u.name
                    )}
                  </div>
                </td>
                {columns ? (
                  columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{col.render(u)}</td>
                  ))
                ) : (
                  <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{u.email}</td>
                )}
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    u.isActive ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'bg-[#FBE7E9] text-mwasalatRed-600'
                  }`}>
                    {!u.passwordSet ? t('userTable.invited') : u.isActive ? t('userTable.active') : t('userTable.blocked')}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[#94A3B8] whitespace-nowrap">
                  <span dir="ltr" className="text-start">{localizeNumber(new Date(u.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}</span>
                </td>
                {(!readOnly || onMessage) && (
                  <td className="px-5 py-3.5 text-end">
                    <div className="inline-flex items-center gap-1.5">
                      {onMessage && (
                        <button
                          type="button"
                          onClick={() => onMessage(u)}
                          aria-label={t('userTable.message')}
                          title={t('userTable.message')}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 transition-colors flex-shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => (u.isActive ? setBlockTarget(u) : onToggle(u))}
                          disabled={pendingId === u._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap ${
                            u.isActive
                              ? 'bg-[#FBE7E9] text-mwasalatRed-600 hover:bg-mwasalatRed-100'
                              : 'bg-mwasalatInk-100 text-mwasalatInk-500 hover:bg-mwasalatInk-200'
                          }`}
                        >
                          {pendingId === u._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.isActive ? (
                            <Ban className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {u.isActive ? t('userTable.block') : t('userTable.unblock')}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedUsers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-[#94A3B8]">
              {localizeNumber(t('dataTable.pageInfo', { current: currentPage, pages, count: sortedUsers.length }), i18n.language)}
            </p>
            <label className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              {t('dataTable.rowsPerPage')}
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-[#E2E8F0] rounded-md bg-white text-[#1E293B] text-[11px] px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
              >
                {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{localizeNumber(size, i18n.language)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={currentPage === pages}
              className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {blockTarget && (
        <MwasalatBlockUserModal
          user={blockTarget}
          isSubmitting={pendingId === blockTarget._id}
          onConfirm={handleConfirmBlock}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </div>
  );
}
