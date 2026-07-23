import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, X, Loader2, AlertTriangle } from 'lucide-react';

export default function MwasalatBlockUserModal({ user, isSubmitting, onConfirm, onClose }) {
  const { t } = useTranslation('mwasalatApp');
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <button
          onClick={onClose}
          className="absolute end-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-mwasalatRed-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-mwasalatRed-600" />
        </div>

        <h3 className="text-base font-bold text-[#1E293B] mb-1">{t('blockUserModal.title', { name: user?.name })}</h3>
        <p className="text-sm text-[#475569] mb-4">
          {t('blockUserModal.body')}
        </p>

        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('blockUserModal.reasonLabel')}</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('blockUserModal.reasonPlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatRed-500/20 hover:border-mwasalatRed-300 transition-colors resize-none"
        />
        <p className="text-xs text-[#94A3B8] mt-1.5">
          {t('blockUserModal.emailNotePrefix')} <span dir="ltr">{user?.email}</span>.
        </p>

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
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {isSubmitting ? t('blockUserModal.blocking') : t('blockUserModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
