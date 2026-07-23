import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Loader2, Printer, Award } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

// Quarter-circle flourish traced into each corner of the inner border — the
// small ornamental touch that keeps the certificate from reading as a plain
// bordered box. `rotate` places the same path in each of the 4 corners.
const CornerFlourish = ({ rotate, className }) => (
  <svg viewBox="0 0 40 40" className={className} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
    <path d="M2 2 Q2 22 22 22 M2 10 Q2 15 7 15 M10 2 Q15 2 15 7" fill="none" stroke="#8C6B6E" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="2" cy="2" r="2.5" fill="#8C6B6E" />
  </svg>
);

export default function MwasalatCertificatePage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const locale = i18n.language === 'ar' ? 'ar-OM' : 'en-GB';
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cert, setCert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mwasalatProgramService.getMyCertificate(id)
      .then(setCert)
      .catch((err) => setError(err.response?.data?.message || t('learnerCertificate.notFound')))
      .finally(() => setIsLoading(false));
  }, [id]);

  // "Download Certificate" links from elsewhere (Completed / Achievements)
  // land here with ?download=1 to jump straight to the print dialog instead
  // of making the learner find the button themselves.
  useEffect(() => {
    if (isLoading || !cert || searchParams.get('download') !== '1') return;
    setSearchParams({}, { replace: true });
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, cert]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('learnerCertificate.loading')}
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-sm text-[#475569] mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-mwasalatInk-500 hover:underline">{t('learnerCertificate.goBack')}</button>
        </div>
      </div>
    );
  }

  const dateFmt = (value) => localizeNumber(new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }), i18n.language);
  const issuedDate = dateFmt(cert.issuedAt);
  const expiresDate = cert.expiresAt ? dateFmt(cert.expiresAt) : null;
  const courseTitle = (i18n.language.startsWith('ar') && cert.courseTitleAr?.trim()) || cert.courseTitle;
  const verifyUrl = cert._id ? `${window.location.origin}/mwasalat/verify/${cert._id}` : null;

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .cert-page { padding: 0 !important; }
          .cert-card, .cert-card * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <button
          onClick={() => navigate('/mwasalat/learner/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('learnerCertificate.backToDashboard')}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> {t('learnerCertificate.printSavePdf')}
        </button>
      </div>

      <div className="cert-page p-4 sm:p-10 flex items-center justify-center">
        <div
          className="cert-card relative bg-white w-full max-w-3xl sm:aspect-[1.414/1] shadow-xl overflow-hidden"
          style={{ border: '10px solid #23181A' }}
        >
          {/* Faint security-paper dot texture — the paper-like touch that keeps a
              plain white rectangle from looking like a screenshot of a form. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #23181A 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.05 }}
          />

          <div className="absolute inset-3 border border-[#D9C9CA]" />
          <CornerFlourish rotate={0} className="absolute top-3 start-3 w-9 h-9 rtl:scale-x-[-1]" />
          <CornerFlourish rotate={90} className="absolute top-3 end-3 w-9 h-9 rtl:scale-x-[-1]" />
          <CornerFlourish rotate={270} className="absolute bottom-3 start-3 w-9 h-9 rtl:scale-x-[-1]" />
          <CornerFlourish rotate={180} className="absolute bottom-3 end-3 w-9 h-9 rtl:scale-x-[-1]" />

          {cert.isExpired && (
            <div
              className="absolute top-10 sm:top-14 end-2 sm:end-4 border-2 border-mwasalatRed-600 text-mwasalatRed-600 rounded-lg px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase"
              style={{ transform: 'rotate(8deg)' }}
            >
              {t('learnerCertificate.expiredStamp')}
            </div>
          )}

          <div className="relative flex flex-col items-center justify-center text-center px-5 sm:px-16 py-8">
            <Link to="/mwasalat">
              <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-11 w-auto object-contain mb-5" />
            </Link>

            <p className="text-[11px] sm:text-xs tracking-[0.3em] text-[#94A3B8] font-semibold uppercase mb-4">
              {t('learnerCertificate.certificateOfCompletion')}
            </p>

            {/* Medallion seal with ribbon tails, standing in for the plain icon-in-circle */}
            <div className="relative mb-5">
              <div className="absolute left-1/2 top-8 -translate-x-1/2 flex gap-1.5">
                <div className="w-3 sm:w-3.5 h-8 sm:h-9 bg-mwasalatRed-600" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)', transform: 'rotate(-8deg)' }} />
                <div className="w-3 sm:w-3.5 h-8 sm:h-9 bg-mwasalatRed-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)', transform: 'rotate(8deg)' }} />
              </div>
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-mwasalatInk-500 to-mwasalatInk-400 flex items-center justify-center p-[3px]">
                <div className="w-full h-full rounded-full bg-mwasalatInk-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-mwasalatInk-500" />
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] mb-2">{t('learnerCertificate.certifyThat')}</p>
            <h1
              className="text-3xl sm:text-5xl text-[#1E293B] mb-1 break-words italic"
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}
            >
              {cert.learnerName}
            </h1>
            <div className="flex items-center gap-2 mb-4 mt-1">
              <span className="w-8 sm:w-10 h-px bg-[#D9C9CA]" />
              <span className="w-1.5 h-1.5 rotate-45 bg-mwasalatRed-500" />
              <span className="w-8 sm:w-10 h-px bg-[#D9C9CA]" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569] mb-1">{t('learnerCertificate.completedCourse')}</p>
            <h2 className="text-base sm:text-2xl font-semibold text-mwasalatInk-500 mb-6 max-w-xl break-words">
              {courseTitle}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-14 mt-2">
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1E293B] border-t border-[#E2E8F0] pt-1.5 min-w-[100px] sm:min-w-[120px]">{issuedDate}</p>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mt-1">{t('learnerCertificate.dateIssuedLabel')}</p>
              </div>
              {expiresDate && (
                <div className="text-center">
                  <p className={`text-sm font-semibold border-t pt-1.5 min-w-[100px] sm:min-w-[120px] ${cert.isExpired ? 'text-mwasalatRed-600 border-mwasalatRed-300' : 'text-[#1E293B] border-[#E2E8F0]'}`}>{expiresDate}</p>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mt-1">{t('learnerCertificate.validUntilLabel')}</p>
                </div>
              )}
              <div className="text-center">
                <p
                  className="text-lg sm:text-xl text-mwasalatInk-500 border-t border-[#E2E8F0] pt-1 min-w-[100px] sm:min-w-[120px]"
                  style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700 }}
                >
                  {cert.instructorName || t('learnerCertificate.instructorFallback')}
                </p>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mt-1">{t('learnerCertificate.instructorLabel')}</p>
              </div>
            </div>

            <p className="text-[10px] text-[#94A3B8] tracking-wide mt-6">
              {t('learnerCertificate.certificateNoLabel')} <span dir="ltr">{cert.certificateNumber}</span>
            </p>
            {!expiresDate && (
              <p className="text-[10px] text-[#94A3B8] tracking-wide mt-1">{t('learnerCertificate.noExpiryNote')}</p>
            )}

            {verifyUrl && (
              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="bg-white p-1.5 rounded-lg border border-[#D9C9CA]">
                  <QRCodeSVG value={verifyUrl} size={52} fgColor="#23181A" bgColor="#ffffff" level="M" />
                </div>
                <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide">{t('learnerCertificate.scanToVerify')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
