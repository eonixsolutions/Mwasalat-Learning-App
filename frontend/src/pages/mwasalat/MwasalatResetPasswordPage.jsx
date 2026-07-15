import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';

const inputClass = 'w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (password) => mwasalatAuthService.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset — you can now sign in');
      navigate('/mwasalat/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset password'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <Link to="/mwasalat">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Reset Password</h2>
          <p className="text-sm text-[#475569]">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data.password))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">New Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-4 h-4 ${errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className={inputClass}
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#C22033] mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Confirm Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-4 h-4 ${errors.confirmPassword ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className={inputClass}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-[#C22033] mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isPending ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
