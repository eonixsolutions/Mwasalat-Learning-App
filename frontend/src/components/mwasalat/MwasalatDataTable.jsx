import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Generic admin list table: client-side search (over `searchable(row)` strings)
// + client-side pagination with a user-selectable page size. Column shape: { key, label, render(row), className }.
export default function MwasalatDataTable({
  columns, rows, isLoading, emptyLabel, searchPlaceholder, searchable, filters,
}) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const resolvedEmptyLabel = emptyLabel ?? t('dataTable.defaultEmpty');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('dataTable.defaultSearchPlaceholder');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_OPTIONS[0]);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchable) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => searchable(row).toLowerCase().includes(q));
  }, [rows, query, searchable]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {(searchable || filters) && (
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          {searchable && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={resolvedSearchPlaceholder}
                className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[13px] bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
              />
            </div>
          )}
          {filters}
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-[#94A3B8] text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin me-2" /> {t('dataTable.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] text-[13px]">{resolvedEmptyLabel}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB] text-start text-[10.5px] text-[#94A3B8] uppercase tracking-wide">
                  {columns.map((col) => (
                    <th key={col.key} className={`px-3.5 py-2 font-semibold border-b border-[#E2E8F0] ${col.className ?? ''}`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr key={row._id ?? i} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8F9FB]/70 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-3.5 py-2 align-middle ${col.className ?? ''}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3">
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-[#94A3B8]">
              {localizeNumber(t('dataTable.pageInfo', { current: currentPage, pages, count: filtered.length }), i18n.language)}
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
    </div>
  );
}
