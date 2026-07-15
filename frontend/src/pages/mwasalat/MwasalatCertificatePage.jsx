import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer, Award } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

export default function MwasalatCertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mwasalatProgramService.getMyCertificate(id)
      .then(setCert)
      .catch((err) => setError(err.response?.data?.message || 'Certificate not found'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading certificate…
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-sm text-[#475569] mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-mwasalatInk-500 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .cert-page { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8">
        <button
          onClick={() => navigate('/mwasalat/learner/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-mwasalatInk-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="cert-page p-4 sm:p-10 flex items-center justify-center">
        <div
          className="relative bg-white w-full max-w-3xl sm:aspect-[1.414/1] shadow-xl"
          style={{ border: '10px solid #23181A' }}
        >
          <div className="absolute inset-3 border border-[#D9C9CA]" />

          <div className="relative flex flex-col items-center justify-center text-center px-5 sm:px-16 py-8">
            <Link to="/mwasalat">
              <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-9 w-auto object-contain mb-5" />
            </Link>

            <p className="text-[11px] sm:text-xs tracking-[0.3em] text-[#94A3B8] font-semibold uppercase mb-3">
              Certificate of Completion
            </p>

            <div className="w-14 h-14 rounded-full bg-mwasalatInk-100 flex items-center justify-center mb-5">
              <Award className="w-7 h-7 text-mwasalatInk-500" />
            </div>

            <p className="text-xs sm:text-sm text-[#475569] mb-2">This is to certify that</p>
            <h1
              className="text-2xl sm:text-4xl font-bold text-[#1E293B] mb-3 break-words"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              {cert.learnerName}
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] mb-1">has successfully completed the course</p>
            <h2 className="text-base sm:text-2xl font-semibold text-mwasalatInk-500 mb-6 max-w-xl break-words">
              {cert.courseTitle}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-16 mt-2">
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1E293B] border-t border-[#E2E8F0] pt-1.5 min-w-[100px] sm:min-w-[120px]">{issuedDate}</p>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mt-1">Date Issued</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1E293B] border-t border-[#E2E8F0] pt-1.5 min-w-[100px] sm:min-w-[120px]">
                  {cert.instructorName || 'Mwasalat Academy'}
                </p>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mt-1">Instructor</p>
              </div>
            </div>

            <p className="text-[10px] text-[#94A3B8] tracking-wide mt-6">
              Certificate No. {cert.certificateNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
