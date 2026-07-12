import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Lock,
  CheckCircle, Loader2, Eye, EyeOff,
  AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { staffService } from '../../services/staff.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_DASHBOARD, ROLE_LOGIN } from '../../constants/roles.js';

const ROLE_LABELS = {
  branch_admin:         'Branch Admin',
  branch_coordinator:   'Branch Coordinator',
  technical_mentor:     'Technical Mentor',
  communication_mentor: 'Communication Mentor',
};

const validatePhone = (val) => {
  const v = (val || '').trim();
  if (!v) return 'Phone number is required';
  if (!v.startsWith('+')) return 'Include your country code, e.g. +91 9999999999';
  try {
    const parsed = parsePhoneNumberFromString(v);
    return parsed?.isValid() || 'Enter a valid phone number, e.g. +91 9999999999';
  } catch {
    return 'Enter a valid phone number, e.g. +91 9999999999';
  }
};

const PASSWORD_RULES = [
  { re: /.{8,}/,                                    label: 'At least 8 characters'         },
  { re: /[A-Za-z]/,                                 label: 'At least one letter'            },
  { re: /\d/,                                       label: 'At least one number'            },
  { re: /[@$!%*#?&^_\-+=<>.,;:'"~`|\\/()\[\]{}]/, label: 'At least one special character' },
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

const StyledInput = forwardRef(function StyledInput({ icon: Icon, error, rightElement, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 ${error ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
        </div>
      )}
      <input
        ref={ref}
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
});

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tealBrand-100 via-white to-coral-100 relative overflow-hidden flex flex-col">
      <div className="absolute top-[12%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70 pointer-events-none" />
      <div className="absolute top-[38%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55 pointer-events-none" />
      <div className="absolute top-[14%] left-[9%] w-4 h-4 rotate-45 border-2 border-teal-500/40 rounded-sm pointer-events-none" />
      <div className="absolute bottom-[22%] left-[7%] text-[#E879A0]/65 text-2xl font-light leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-[18%] right-[10%] w-4 h-4 rounded-full border-2 border-teal-400/50 pointer-events-none" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}

export default function StaffRegister() {
  const { isAuthenticated, role } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [submitted, setSubmitted] = useState(false);
  const [roleAdded, setRoleAdded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({ mode: 'onTouched' });

  const { data: inviteData, isLoading: inviteLoading, isError: inviteError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => staffService.validateInvite(token),
    enabled: !!token,
    retry: false,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: staffService.registerWithInvite,
    onSuccess: (data) => { setRoleAdded(!!data?.roleAdded); setSubmitted(true); },
    onError: (err) => {
      const fieldErrors = err.response?.data?.error;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, message }) => setError(field, { type: 'server', message }));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    },
  });

  const onSubmit = ({ confirmPassword, email: formEmail, ...data }) =>
    mutate({ ...data, email: inviteData?.email || formEmail, token });
  const pw = watch('password') || '';
  const loginPath = ROLE_LOGIN[inviteData?.role] ?? '/admin/login';

  if (isAuthenticated && role) return <Navigate to={ROLE_DASHBOARD[role]} replace />;

  if (!token) {
    return (
      <PageShell>
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <div className="w-16 h-16 bg-[#FEF0EE] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#C76D64]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">No invite link</h3>
          <p className="text-sm text-[#475569] mb-6">You need a valid invite link from an admin to register as staff.</p>
          <Link to={loginPath} className="text-sm text-[#1F5E63] hover:underline font-medium">Go to Login</Link>
        </div>
      </PageShell>
    );
  }

  if (inviteLoading) {
    return (
      <PageShell>
        <Loader2 className="w-8 h-8 text-[#1F5E63] animate-spin" />
      </PageShell>
    );
  }

  if (inviteError) {
    return (
      <PageShell>
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <div className="w-16 h-16 bg-[#FEF0EE] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#C76D64]" />
          </div>
          <h3 className="text-xl font-bold text-[#1E293B] mb-2">Invalid invite link</h3>
          <p className="text-sm text-[#475569] mb-6">This link is invalid, has already been used, or has expired. Ask your admin for a new invite.</p>
          <Link to={loginPath} className="text-sm text-[#1F5E63] hover:underline font-medium">Go to Login</Link>
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
          <div className="w-20 h-20 bg-[#E6F4F5] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-[#1F5E63]" />
          </div>
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-2">
            {roleAdded ? 'Role Added' : 'Almost there'}
          </p>
          <h3 className="text-2xl font-bold text-[#1E293B] mb-3">
            {roleAdded ? 'New role assigned!' : 'Check your email'}
          </h3>
          <p className="text-[#475569] text-sm leading-relaxed mb-8">
            {roleAdded
              ? `The ${ROLE_LABELS[inviteData?.role] ?? inviteData?.role ?? 'new'} role has been added to your existing account. You can now login using your existing credentials.`
              : <>We sent a verification link to{' '}
                  <span className="font-semibold text-[#1E293B]">{inviteData?.email || watch('email')}</span>.
                  Verify your email to activate your account.</>
            }
          </p>
          <Link
            to={loginPath}
            className="inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm w-full"
          >
            Go to Login
          </Link>
        </div>
      </PageShell>
    );
  }

  const roleLabel = ROLE_LABELS[inviteData?.role] ?? 'Staff';
  const roleParts = roleLabel.split(' ');
  const coloredWord = roleParts[roleParts.length - 1];
  const plainPart = roleParts.slice(0, -1).join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-tealBrand-100 via-white to-coral-100 relative overflow-hidden flex flex-col">

      {/* Floating decorative elements */}
      <div className="absolute top-[8%] right-[13%] w-3 h-3 rounded-full bg-purple-400/70 pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-4 h-4 rounded-full bg-purple-500/55 pointer-events-none" />
      <div className="absolute top-[12%] left-[8%] w-4 h-4 rotate-45 border-2 border-teal-500/40 rounded-sm pointer-events-none" />
      <div className="absolute bottom-[12%] left-[7%] text-[#E879A0]/65 text-2xl font-light leading-none select-none pointer-events-none">+</div>
      <div className="absolute bottom-[10%] right-[10%] w-4 h-4 rounded-full border-2 border-teal-400/50 pointer-events-none" />
      <div className="absolute top-[55%] left-[4%] w-2.5 h-2.5 rotate-45 bg-[#F59E0B]/50 pointer-events-none" />
      <div className="absolute top-[20%] right-[7%] w-2 h-2 rounded-full bg-[#F59E0B]/60 pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-12">

        {/* Invite badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-[#475569] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm border border-white">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1F5E63]" />
          Invite-only registration
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight mb-3 leading-tight">
          {plainPart && <span className="text-[#1E293B]">{plainPart} </span>}
          <span className="text-[#C76D64]">{coloredWord}</span>
        </h1>
        <p className="text-[#475569] text-sm mb-10">You were invited to join Eonix Solutions as staff.</p>

        {/* Form */}
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
              <div>
                <p className="text-xs font-bold tracking-widest text-[#7C6AF2] uppercase mb-1">Your Details</p>
                <h3 className="text-lg font-bold text-[#1E293B]">Create your account</h3>
              </div>

              {inviteData?.email ? (
                <FieldWrapper label="Email" required hint="Pre-set by your admin — cannot be changed">
                  <div className="relative flex items-center pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] opacity-70">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                    <span className="text-sm text-[#1E293B]">{inviteData.email}</span>
                  </div>
                </FieldWrapper>
              ) : (
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
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Full Name" required error={errors.name?.message}>
                  <StyledInput
                    icon={User}
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'At least 2 characters' },
                      pattern: { value: /^[a-zA-Z\s'-]+$/, message: 'Letters only' },
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
              </div>

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
                    placeholder="Re-enter password"
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isPending ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-[#94A3B8]">
              Already have an account?{' '}
              <Link to={loginPath} className="text-[#1F5E63] hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-12">
          <img src="/eonix-logo.png" alt="Eonix" className="h-7" />
          <p className="text-xs text-[#94A3B8]">© 2026 Eonix Solutions. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
