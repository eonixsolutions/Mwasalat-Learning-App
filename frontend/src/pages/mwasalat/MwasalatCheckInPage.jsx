import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';

export default function MwasalatCheckInPage() {
  const { t } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    mwasalatProgramService.checkIn(id)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || t('learner.checkIn.failedTitle'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <Link to="/mwasalat" className="inline-block">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain mx-auto mb-6" />
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3 animate-spin" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('learner.checkIn.checkingIn')}</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('learner.checkIn.successTitle')}</h2>
            <p className="text-sm text-[#475569]">{t('learner.checkIn.successBody')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-mwasalatRed-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('learner.checkIn.failedTitle')}</h2>
            <p className="text-sm text-[#475569] mb-4">{message}</p>
            <Link to="/mwasalat/login" className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learner.checkIn.signInRetry')}</Link>
          </>
        )}
      </div>
    </div>
  );
}
