import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, Clock, ShieldCheck, Bell, PhoneCall, MessageCircle } from 'lucide-react';
import api from '../../api/axios.js';
import { ROLE_LOGIN } from '../../constants/roles.js';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [isStaff, setIsStaff] = useState(false);
  const called = useRef(false);

  const { mutate } = useMutation({
    mutationFn: async (t) => {
      const res = await api.get(`/auth/verify-email/${t}`);
      return res.data.data;
    },
    onSuccess: (data) => {
      const isStudent = data?.roles ? data.roles.includes('student') : (!data?.role || data.role === 'student');
      setIsStaff(!isStudent);
      setStatus('success');
      if (!isStudent) {
        const loginPath = ROLE_LOGIN[data.role] ?? '/admin/login';
        setTimeout(() => navigate(loginPath), 2000);
      }
    },
    onError: () => setStatus('error'),
  });

  useEffect(() => {
    if (token && !called.current) {
      called.current = true;
      mutate(token);
    }
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === 'verifying' && (
        <>
          <Loader2 className="w-12 h-12 text-[#1F5E63] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">Verifying your email…</h3>
          <p className="text-[#475569] text-sm">Please wait a moment.</p>
        </>
      )}

      {status === 'success' && isStaff && (
        <>
          <div className="w-16 h-16 bg-[#E6F4F5] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#1F5E63]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">Email verified!</h3>
          <p className="text-[#475569] text-sm">Redirecting to login…</p>
        </>
      )}

      {status === 'success' && !isStaff && (
        <>
          <div className="w-16 h-16 bg-[#E6F4F5] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#1F5E63]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">Email verified!</h3>
          <p className="text-[#475569] text-sm mb-6">
            Your email is confirmed. Here's what happens next before you can log in:
          </p>

          <div className="text-left bg-[#F8F9FB] rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-[#1F5E63]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Email verified</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Done — your email is confirmed.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Payment screenshot under review</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Our team is verifying the receipt you uploaded.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#94A3B8]">Coordinator approval</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">A coordinator will activate your account once verified.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#94A3B8]">You'll be notified</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">You'll receive an email when your account is ready.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8] mb-5">
            This usually takes a few hours. Need help?
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <a
              href="tel:+918089272211"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F5E63] hover:text-[#2F7A80] transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call us
            </a>
            <span className="text-[#E2E8F0]">|</span>
            <a
              href="https://wa.me/918089272211"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22A66E] hover:text-[#1a8057] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>

          <Link
            to="/login"
            className="inline-block bg-[#1F5E63] hover:bg-[#2F7A80] text-white text-sm font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-[#FBE9E7] rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-[#D96C5F]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">Verification failed</h3>
          <p className="text-[#475569] text-sm mb-6">
            This link is invalid or has expired. Please register again.
          </p>
          <Link
            to="/register"
            className="inline-block bg-[#D96C5F] hover:bg-[#C45E52] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Back to Register
          </Link>
        </>
      )}
    </div>
  );
}
