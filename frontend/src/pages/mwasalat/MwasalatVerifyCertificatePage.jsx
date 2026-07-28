import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Award } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLanguageToggle from '../../components/mwasalat/MwasalatLanguageToggle.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

export default function MwasalatVerifyCertificatePage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | valid | expired | notFound
  const [cert, setCert] = useState(null);

  useEffect(() => {
    mwasalatProgramService.verifyCertificate(id)
      .then((result) => {
        setCert(result);
        setStatus(result.isExpired ? 'expired' : 'valid');
      })
      .catch(() => setStatus('notFound'));
  }, [id]);

  const courseTitle = cert && ((i18n.language.startsWith('ar') && cert.courseTitleAr?.trim()) || cert.courseTitle);
  const category = cert && ((i18n.language.startsWith('ar') && cert.categoryAr?.trim()) || cert.category);
  const dateFmt = (value) => localizeNumber(new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }), i18n.language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 end-4 z-20">
        <MwasalatLanguageToggle className="!text-mwasalatInk-500 !border-mwasalatInk-200 hover:!border-mwasalatInk-400 bg-white/70 backdrop-blur" />
      </div>

      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <Link to="/" className="inline-block">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain mx-auto mb-6" />
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3 animate-spin" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('verifyCertificate.checking')}</h2>
          </>
        )}

        {status === 'notFound' && (
          <>
            <XCircle className="w-10 h-10 text-mwasalatRed-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{t('verifyCertificate.notFoundTitle')}</h2>
            <p className="text-sm text-[#475569]">{t('verifyCertificate.notFoundBody')}</p>
          </>
        )}

        {(status === 'valid' || status === 'expired') && cert && (
          <>
            {status === 'valid' ? (
              <CheckCircle2 className="w-10 h-10 text-[#22C55E] mx-auto mb-3" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
            )}
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">
              {t(status === 'valid' ? 'verifyCertificate.validTitle' : 'verifyCertificate.expiredTitle')}
            </h2>
            <p className="text-sm text-[#475569] mb-5">
              {t(status === 'valid' ? 'verifyCertificate.validBody' : 'verifyCertificate.expiredBody')}
            </p>

            <div className="bg-[#F8F9FB] rounded-xl p-5 text-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-mwasalatInk-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">{cert.learnerName}</p>
                  <p className="text-xs text-[#94A3B8] truncate">{courseTitle}</p>
                </div>
              </div>

              <dl className="space-y-2 text-sm">
                {category && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#94A3B8]">{t('verifyCertificate.categoryLabel')}</dt>
                    <dd className="font-medium text-[#1E293B] text-end">{category}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#94A3B8]">{t('verifyCertificate.issuedLabel')}</dt>
                  <dd className="font-medium text-[#1E293B]" dir="ltr">{dateFmt(cert.issuedAt)}</dd>
                </div>
                {cert.expiresAt && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#94A3B8]">{t('verifyCertificate.expiresLabel')}</dt>
                    <dd className={`font-medium ${status === 'expired' ? 'text-mwasalatRed-600' : 'text-[#1E293B]'}`} dir="ltr">{dateFmt(cert.expiresAt)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#94A3B8]">{t('verifyCertificate.certNoLabel')}</dt>
                  <dd className="font-medium text-[#1E293B]" dir="ltr">{cert.certificateNumber}</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
