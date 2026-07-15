import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

export default function MwasalatCheckInPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    mwasalatProgramService.checkIn(id)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Check-in failed');
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <Link to="/mwasalat" className="inline-block">
          <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-10 w-auto object-contain mx-auto mb-6" />
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3 animate-spin" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">Checking you in…</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-mwasalatInk-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">You're checked in!</h2>
            <p className="text-sm text-[#475569]">Your attendance has been recorded for this session.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-mwasalatRed-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1E293B] mb-1">Check-in failed</h2>
            <p className="text-sm text-[#475569] mb-4">{message}</p>
            <Link to="/mwasalat/login" className="text-sm font-medium text-mwasalatInk-500 hover:underline">Sign in and try again</Link>
          </>
        )}
      </div>
    </div>
  );
}
