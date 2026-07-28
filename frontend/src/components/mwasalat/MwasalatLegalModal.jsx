import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function MwasalatLegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const { t } = useTranslation('mwasalatApp');
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const doc = t(`legal.${tab}`, { returnObjects: true });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('terms')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors',
                tab === 'terms' ? 'bg-mwasalatInk-500 text-white' : 'text-[#475569] hover:bg-mwasalatInk-100'
              )}
            >
              {t('legal.termsTab')}
            </button>
            <button
              type="button"
              onClick={() => setTab('privacy')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors',
                tab === 'privacy' ? 'bg-mwasalatInk-500 text-white' : 'text-[#475569] hover:bg-mwasalatInk-100'
              )}
            >
              {t('legal.privacyTab')}
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-[#1E293B] mb-1.5">{doc.title}</h3>
          <p className="text-sm text-[#475569] mb-5">{doc.intro}</p>
          <div className="space-y-4">
            {doc.sections.map((section) => (
              <div key={section.heading}>
                <h4 className="text-sm font-semibold text-[#1E293B] mb-1">{section.heading}</h4>
                <p className="text-sm text-[#475569] leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white text-sm font-semibold transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
