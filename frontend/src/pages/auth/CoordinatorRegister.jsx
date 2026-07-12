import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Lock, Briefcase,
  CheckCircle, Loader2, Eye, EyeOff, Clock,
} from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { coordinatorService } from '../../services/coordinator.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_DASHBOARD } from '../../constants/roles.js';

const validatePhone = (val) => {
  if (!val) return 'Phone number is required';
  const parsed = parsePhoneNumberFromString(val.startsWith('+') ? val : `+${val.replace(/^0+/, '')}`);
  return parsed?.isValid() || 'Enter a valid phone number (e.g. +91 9999999999)';
};

const PASSWORD_RULES = [
  { re: /.{8,}/,                                     label: 'At least 8 characters'         },
  { re: /[A-Za-z]/,                                  label: 'At least one letter'            },
  { re: /\d/,                                        label: 'At least one number'            },
  { re: /[@$!%*#?&^_\-+=<>.,;:'"~`|\\/()\[\]{}]/,   label: 'At least one special character' },
];

function FieldWrapper({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
        {label} {required && <span className="text-[#D96C5F]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#94A3B8] mt-1">{hint}</p>}
      {error && <p className="text-xs text-[#D96C5F] mt-1">{error}</p>}
    </div>
  );
}

function StyledInput({ icon: Icon, error, rightElement, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 ${error ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
        </div>
      )}
      <input
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20'
            : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
        }`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
  );
}

export default function CoordinatorRegister() {
  const { isAuthenticated, role } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({ mode: 'onTouched' });

  const { mutate, isPending } = useMutation({
    mutationFn: coordinatorService.register,
    onSuccess: () => setSubmitted(true),
    onError: (err) => {
      const fieldErrors = err.response?.data?.error;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, message }) => setError(field, { type: 'server', message }));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    },
  });

  const onSubmit = ({ confirmPassword, ...data }) => mutate(data);
  const pw = watch('password') || '';

  if (isAuthenticated && role) return <Navigate to={ROLE_DASHBOARD[role]} replace />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
          <div className="w-20 h-20 bg-[#E6F4F5] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-[#1F5E63]" />
          </div>
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-2">Almost there</p>
          <h3 className="text-2xl font-bold text-[#1E293B] mb-3">Check your email</h3>
          <p className="text-[#475569] text-sm leading-relaxed mb-3">
            We sent a verification link to{' '}
            <span className="font-semibold text-[#1E293B]">{watch('email')}</span>.
          </p>
          <div className="flex items-start gap-3 bg-[#FFFBEB] rounded-2xl p-4 text-left mb-8">
            <Clock className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#92400E] leading-relaxed">
              After verifying your email, your account will be reviewed by the admin.
              You will be able to log in once your account is approved.
            </p>
          </div>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 bg-[#1F5E63] hover:bg-[#174D51] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm w-full"
          >
            Go to Login
          </Link>
          <Link to="/" className="block text-sm text-[#94A3B8] hover:text-[#475569] transition-colors mt-3">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">

      {/* Hero */}
      <div className="bg-[#1F5E63] pt-8 pb-16 px-6 text-center relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <circle cx="5%"  cy="50%" r="160" fill="none" stroke="white" strokeOpacity="0.1"  strokeWidth="1.5" />
          <circle cx="95%" cy="50%" r="200" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
          <circle cx="95%" cy="50%" r="70"  fill="white" fillOpacity="0.07" />
          <circle cx="30%" cy="90%" r="4"   fill="white" fillOpacity="0.25" />
          <circle cx="70%" cy="10%" r="3"   fill="white" fillOpacity="0.2"  />
        </svg>
        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest text-[#A7D1D4] uppercase mb-2">Staff Registration</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Branch Coordinator</h1>
          <p className="text-white/60 text-sm">Create your coordinator account. Admin approval required before login.</p>
        </div>
      </div>
      <svg viewBox="0 0 1440 48" fill="none" className="w-full block -mt-px" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L1440,0 L1440,20 C1200,48 960,8 720,32 C480,56 240,8 0,32 Z" fill="#F8F9FB" />
      </svg>

      {/* Form */}
      <div className="flex-1 px-4 sm:px-6 pb-16 -mt-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            <div className="bg-white rounded-2xl p-6 space-y-5 border-l-4 border-[#1F5E63]" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <div>
                <p className="text-xs font-bold tracking-widest text-[#1F5E63] uppercase mb-1">Account Details</p>
                <h3 className="text-base font-bold text-[#1E293B]">Your information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Full Name" required error={errors.name?.message}>
                  <StyledInput
                    icon={User}
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'At least 2 characters' },
                      maxLength: { value: 50, message: 'Under 50 characters' },
                      pattern: { value: /^[a-zA-Z\s'-]+$/, message: 'Letters only' },
                    })}
                  />
                </FieldWrapper>

                <FieldWrapper label="Email" required error={errors.email?.message}>
                  <StyledInput
                    icon={Mail}
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                    })}
                  />
                </FieldWrapper>

                <FieldWrapper label="Phone" required hint="Include country code, e.g. +91" error={errors.phone?.message}>
                  <StyledInput
                    icon={Phone}
                    type="tel"
                    placeholder="+91 9999999999"
                    error={errors.phone?.message}
                    {...register('phone', { validate: validatePhone })}
                  />
                </FieldWrapper>

                <FieldWrapper label="Designation" hint="Optional — e.g. Senior Coordinator" error={errors.designation?.message}>
                  <StyledInput
                    icon={Briefcase}
                    placeholder="e.g. Branch Coordinator"
                    error={errors.designation?.message}
                    {...register('designation', {
                      maxLength: { value: 100, message: 'Under 100 characters' },
                    })}
                  />
                </FieldWrapper>
              </div>

              <div className="h-px bg-[#F1F5F9]" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Password" required error={errors.password?.message}>
                  <StyledInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    error={errors.password?.message}
                    rightElement={
                      <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="text-[#94A3B8] hover:text-[#475569]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    {...register('password', {
                      required: 'Password is required',
                      validate: (val) => {
                        const failed = PASSWORD_RULES.filter((r) => !r.re.test(val));
                        return failed.length === 0 || failed[0].label;
                      },
                    })}
                  />
                </FieldWrapper>

                <FieldWrapper label="Confirm Password" required error={errors.confirmPassword?.message}>
                  <StyledInput
                    icon={Lock}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword?.message}
                    rightElement={
                      <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="text-[#94A3B8] hover:text-[#475569]">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (val) => val === watch('password') || 'Passwords do not match',
                    })}
                  />
                </FieldWrapper>
              </div>

              {pw && (
                <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                  {PASSWORD_RULES.map(({ re, label }) => {
                    const ok = re.test(pw);
                    return (
                      <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-[#22A66E]' : 'text-[#94A3B8]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? 'bg-[#22A66E]' : 'bg-[#CBD5E1]'}`} />
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Notice + submit */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-start gap-3 bg-[#FFFBEB] rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#92400E] mb-0.5">Pending Admin Approval</p>
                    <p className="text-xs text-[#B45309] leading-relaxed">
                      After email verification, an admin must approve your account before you can log in.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-[#1F5E63] hover:bg-[#174D51] disabled:opacity-60 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isPending ? 'Creating account…' : 'Create Coordinator Account'}
                </button>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] text-center pb-2">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-[#1F5E63] hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
