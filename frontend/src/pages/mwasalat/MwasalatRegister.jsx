import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';

const inputClass = 'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors';

export default function MwasalatRegister() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useMwasalatAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatAuthService.register,
    onSuccess: () => {
      toast.success('Welcome to Mwasalat Learning Platform!');
      navigate('/mwasalat/learner/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  });

  if (isAuthenticated && user) {
    return <Navigate to="/mwasalat/learner/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mwasalatInk-100 via-white to-mwasalatRed-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <div className="flex items-center justify-center mb-6">
          <Link to="/mwasalat">
            <img src="/mwasalat-logo.png" alt="Mwasalat" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">Create Account</h2>
          <p className="text-sm text-[#475569]">Join the Mwasalat Learning Platform</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className={`w-4 h-4 ${errors.name ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                className={`${inputClass} ${errors.name ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('name', { required: 'Name is required' })}
              />
            </div>
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className={`w-4 h-4 ${errors.email ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type="email"
                className={`${inputClass} ${errors.email ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('email', { required: 'Email is required' })}
              />
            </div>
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className={`w-4 h-4 ${errors.password ? 'text-[#C22033]' : 'text-[#94A3B8]'}`} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className={`${inputClass} pr-10 ${errors.password ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#C22033] mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Already have an account?{' '}
          <a href="/mwasalat/login" className="text-mwasalatInk-500 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
