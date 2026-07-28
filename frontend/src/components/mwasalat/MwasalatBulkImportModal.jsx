import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, UploadCloud, Loader2, FileText, Download, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const CSV_TEMPLATE = 'name,email,role,phone\nJane Doe,jane@example.com,learner,+968 9000 0000\n';

export default function MwasalatBulkImportModal({ onClose, onImported }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwasalat-user-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const res = await mwasalatUserService.bulkImport(file);
      setResults(res);
      if (res.created > 0) onImported?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('bulkImport.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('bulkImport.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!results ? (
          <>
            <p className="text-sm text-[#475569] mb-4">{t('bulkImport.body')}</p>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors mb-4"
            >
              <Download className="w-3.5 h-3.5" /> {t('bulkImport.downloadTemplate')}
            </button>

            <label
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-[#E2E8F0] hover:border-mwasalatInk-300 cursor-pointer transition-colors text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <FileText className="w-6 h-6 text-mwasalatInk-500" />
                  <span className="text-sm font-medium text-[#1E293B]">{file.name}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-[#94A3B8]" />
                  <span className="text-sm font-medium text-[#475569]">{t('bulkImport.chooseFile')}</span>
                  <span className="text-xs text-[#94A3B8]">{t('bulkImport.csvOnly')}</span>
                </>
              )}
            </label>

            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isImporting}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isImporting ? t('bulkImport.importing') : t('bulkImport.importCta')}
            </button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-[#DCFCE7] p-3 text-center">
                <p className="text-lg font-bold text-[#16A34A]">{localizeNumber(results.created, i18n.language)}</p>
                <p className="text-[11px] font-medium text-[#16A34A]">{t('bulkImport.created')}</p>
              </div>
              <div className="rounded-xl bg-[#F1F5F9] p-3 text-center">
                <p className="text-lg font-bold text-[#475569]">{localizeNumber(results.skipped, i18n.language)}</p>
                <p className="text-[11px] font-medium text-[#475569]">{t('bulkImport.skipped')}</p>
              </div>
              <div className="rounded-xl bg-mwasalatRed-100 p-3 text-center">
                <p className="text-lg font-bold text-mwasalatRed-600">{localizeNumber(results.errors.length, i18n.language)}</p>
                <p className="text-[11px] font-medium text-mwasalatRed-600">{t('bulkImport.failed')}</p>
              </div>
            </div>

            {results.created > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-[#16A34A] mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('bulkImport.createdNote')}
              </p>
            )}

            {results.skippedRows?.length > 0 && (
              <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                {results.skippedRows.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#F1F5F9] text-xs">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
                    <span className="text-mwasalatInk-500">
                      {t('bulkImport.rowLabel', { row: s.row })}{s.email ? ` (${s.email})` : ''} — {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
                {results.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-mwasalatRed-100 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-mwasalatRed-600 flex-shrink-0 mt-0.5" />
                    <span className="text-mwasalatInk-500">
                      {t('bulkImport.rowLabel', { row: e.row })}{e.email ? ` (${e.email})` : ''} — {e.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {t('common.close')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
