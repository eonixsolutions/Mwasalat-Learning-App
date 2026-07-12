import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CheckCircle, Loader2, Check, ArrowLeft,
  User, Mail, Phone, Lock, MapPin, GraduationCap,
  Monitor, Users, Code2, Briefcase, Rocket, BookOpen,
  PhoneCall, MessageCircle, ImageIcon, X, Building2,
} from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { authService } from '../../services/auth.service.js';
import { courseService } from '../../services/course.service.js';
import { branchService } from '../../services/branch.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_DASHBOARD } from '../../constants/roles.js';

const COURSE_ICONS = { Zero2Code: Code2, Code2Career: Briefcase, 'AI Launchpad': Rocket };

const COURSE_COLORS = [
  { icon: '#1F5E63', bg: '#E6F4F5', selectedBorder: '#1F5E63', selectedBg: '#E6F4F5', selectedText: '#1F5E63', selectedSub: '#2F7A80' },
  { icon: '#7C6AF2', bg: '#F2EEFD', selectedBorder: '#7C6AF2', selectedBg: '#F2EEFD', selectedText: '#5B4FCF', selectedSub: '#7C6AF2' },
  { icon: '#C76D64', bg: '#FDEFEE', selectedBorder: '#C76D64', selectedBg: '#FDEFEE', selectedText: '#A94E43', selectedSub: '#C76D64' },
];

const validatePhone = (val) => {
  if (!val) return 'Phone number is required';
  const parsed = parsePhoneNumberFromString(val.startsWith('+') ? val : `+${val.replace(/^0+/, '')}`);
  return (parsed?.isValid()) || 'Enter a valid phone number (e.g. +91 9999999999)';
};

const PASSWORD_RULES = [
  { re: /.{8,}/,                                        label: 'At least 8 characters'        },
  { re: /[A-Za-z]/,                                     label: 'At least one letter'           },
  { re: /\d/,                                           label: 'At least one number'           },
  { re: /[@$!%*#?&^_\-+=<>.,;:'"~`|\\/()\[\]{}]/,      label: 'At least one special character' },
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

const StyledInput = forwardRef(function StyledInput({ icon: Icon, error, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 ${error ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
        </div>
      )}
      <input
        ref={ref}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20'
            : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'
        }`}
        {...props}
      />
    </div>
  );
});

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[#E2E8F0]" />
      <span className="text-xs font-bold tracking-widest text-[#C76D64] uppercase">{label}</span>
      <div className="flex-1 h-px bg-[#E2E8F0]" />
    </div>
  );
}

export default function Register() {
  const { isAuthenticated, role } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseError, setCourseError]       = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchError, setBranchError]           = useState('');
  const [submitted, setSubmitted]           = useState(false);
  const [receiptFile, setReceiptFile]       = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptError, setReceiptError]     = useState('');
  const fileRef                             = useState(null);

  const handleReceiptFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
    setReceiptError('');
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({ mode: 'onTouched' });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: courseService.getActive,
  });

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches', 'public'],
    queryFn: branchService.getPublic,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authService.register,
    onSuccess: (_, variables) => {
      localStorage.setItem('eonix_reg_email', variables.email);
      localStorage.setItem('eonix_reg_course', selectedCourse?.name || '');
      setSubmitted(true);
    },
    onError: (err) => {
      const fieldErrors = err.response?.data?.error;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, message }) => setError(field, { type: 'server', message }));
        document.querySelector(`[name="${fieldErrors[0]?.field}"]`)?.focus();
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    },
  });

  const onSubmit = (data) => {
    if (!selectedCourse)   { setCourseError('Please select a program to continue'); return; }
    if (!selectedBranchId) { setBranchError('Please select a branch location'); return; }
    if (!receiptFile)      { setReceiptError('Please upload your payment screenshot'); return; }
    setCourseError('');
    setBranchError('');
    setReceiptError('');
    const { confirmPassword, ...payload } = data;
    mutate({ ...payload, courseId: selectedCourse._id, branchId: selectedBranchId, receipt: receiptFile });
  };

  const pw = watch('password') || '';

  if (isAuthenticated && role) return <Navigate to={ROLE_DASHBOARD[role]} replace />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
          <div className="w-20 h-20 bg-[#E6F4F5] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-[#1F5E63]" />
          </div>
          <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-2">You're in!</p>
          <h3 className="text-2xl font-bold text-[#1E293B] mb-3">Check your email</h3>
          <p className="text-[#475569] text-sm leading-relaxed mb-2">
            We've sent a verification link to{' '}
            <span className="font-semibold text-[#1E293B]">{watch('email')}</span>.
          </p>
          <p className="text-[#475569] text-sm leading-relaxed mb-8">
            Your payment receipt has been submitted. Once you verify your email, our coordinator will review and activate your account — usually within 24 hours.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Login
            </Link>
            <Link to="/" className="text-sm text-[#94A3B8] hover:text-[#475569] transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-[#F1F5F9] flex items-center justify-between px-6 flex-shrink-0" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <Link to="/">
          <img src="/eonix-logo.png" alt="Eonix Solutions" className="h-8 w-auto" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#C76D64] hover:bg-[#A94E43] px-4 py-2 rounded-lg transition-colors border-none outline-none">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#EEEAF6]"
        style={{ background: 'linear-gradient(110deg, #FFF8F6 0%, #FCFCFD 48%, #F6F8FF 100%)' }}>

        <div className="relative z-10 max-w-5xl mx-auto px-8 py-3 sm:py-5 flex items-center">

          {/* Left 55% */}
          <div className="flex-1 min-w-0" style={{ maxWidth: '55%', paddingRight: '2rem' }}>
            <p className="text-xs font-bold text-[#C76D64] mb-2.5 tracking-widest uppercase">WELCOME!</p>
            <h1 className="text-3xl sm:text-[2.5rem] font-bold text-[#1A1A2E] leading-[1.2] mb-2.5 tracking-tight">
              Student Registration
            </h1>
            <p className="text-[#64748B] text-[15px] leading-relaxed mb-5" style={{ maxWidth: '360px' }}>
              Join Eonix Solutions — structured mentorship, live projects, and real placement support.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { icon: Users,     label: 'Expert Mentors',    bg: '#EDF9F4', color: '#1A9E6F' },
                { icon: Code2,     label: 'Live Projects',     bg: '#EAF4F5', color: '#1F5E63' },
                { icon: Briefcase, label: 'Placement Support', bg: '#FEF0ED', color: '#C76D64' },
              ].map(({ icon: Icon, label, bg, color }) => (
                <div key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
                  style={{ backgroundColor: bg, color, borderColor: `${color}22` }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right 45% illustration */}
          <div className="hidden sm:flex flex-col items-center justify-center relative flex-shrink-0"
            style={{ width: '45%', minHeight: '260px' }}>

            {/* Organic blob behind image */}
            <div className="absolute pointer-events-none" style={{
              width: '520px', height: '420px',
              top: '50%', left: '50%',
              transform: 'translate(-44%, -52%)',
              borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%',
              background: 'radial-gradient(ellipse at 30% 35%, #FBECE8 0%, transparent 55%), radial-gradient(ellipse at 70% 25%, #F2EEFB 0%, transparent 55%), radial-gradient(ellipse at 55% 72%, #EDEBFA 0%, transparent 55%), radial-gradient(ellipse at 18% 75%, #E5EEFC 0%, transparent 55%)',
              filter: 'blur(48px)',
              opacity: 0.9,
              zIndex: 0,
            }} />

            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
              <span className="absolute font-bold select-none" style={{ top: '8%',  right: '10%', fontSize: '10px', color: '#A38BFF', opacity: 0.55 }}>◆</span>
              <span className="absolute font-bold select-none" style={{ top: '20%', left:  '6%',  fontSize: '8px',  color: '#5C8CFF', opacity: 0.45 }}>◆</span>
              <span className="absolute font-bold select-none" style={{ top: '68%', right: '6%',  fontSize: '14px', color: '#7C6CF3', opacity: 0.38 }}>+</span>
              <span className="absolute font-bold select-none" style={{ top: '14%', right: '28%', fontSize: '12px', color: '#FF8D6B', opacity: 0.38 }}>+</span>
              <div className="absolute rounded-full" style={{ width: '7px', height: '7px', top: '54%', left: '4%',  backgroundColor: '#A38BFF', opacity: 0.32 }} />
              <div className="absolute rounded-full" style={{ width: '5px', height: '5px', top: '24%', right: '5%', backgroundColor: '#FF8D6B', opacity: 0.38 }} />
              <div className="absolute rounded-full" style={{ width: '6px', height: '6px', top: '80%', left: '18%', backgroundColor: '#5C8CFF', opacity: 0.32 }} />
              <span className="absolute select-none" style={{ top: '5%',  left: '22%', fontSize: '12px', color: '#F59E0B', opacity: 0.48 }}>✦</span>
              <span className="absolute select-none" style={{ top: '76%', right: '16%', fontSize: '10px', color: '#7C6CF3', opacity: 0.42 }}>✦</span>
            </div>

            {/* Cap illustration */}
            <img src="/registration-cap.png" alt="Student graduation cap"
              className="relative object-contain"
              style={{ zIndex: 1, width: '85%', maxWidth: '320px' }} />
          </div>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 sm:px-6 pb-16 pt-7">
        <div className="max-w-4xl mx-auto">

          {/* ── Progress stepper ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl px-6 py-4 mb-6 flex items-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {[
              { n: 1, label: 'Choose Program', sub: 'Select the course you want to join', active: true,           done: !!selectedCourse },
              { n: 2, label: 'Your Details',   sub: 'Fill in your information',           active: !!selectedCourse, done: false            },
            ].map(({ n, label, sub, active, done }, i, arr) => (
              <div key={n} className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    done    ? 'bg-[#22A66E] text-white' :
                    active  ? 'bg-[#1F5E63] text-white' :
                              'bg-[#F1F5F9] text-[#94A3B8] border-2 border-[#E2E8F0]'
                  }`}>
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-semibold leading-tight ${active || done ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>{label}</p>
                    <p className="text-[11px] text-[#94A3B8]">{sub}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 mx-4 flex items-center gap-1">
                    {Array.from({ length: 6 }).map((_, k) => (
                      <div key={k} className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: done ? '#22A66E' : '#E2E8F0' }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* ── Step 1: Choose Program ───────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <p className="text-xs font-bold tracking-widest text-[#1F5E63] uppercase mb-1">Step 1</p>
              <h3 className="text-lg font-bold text-[#1E293B] mb-5">Which program are you applying for?</h3>

              {coursesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-[#1F5E63] animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-4">No programs available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {courses.map((course, idx) => {
                    const isSelected = selectedCourse?._id === course._id;
                    const Icon = COURSE_ICONS[course.name] || BookOpen;
                    const colors = COURSE_COLORS[idx % COURSE_COLORS.length];
                    return (
                      <button
                        key={course._id}
                        type="button"
                        onClick={() => { setSelectedCourse(isSelected ? null : course); if (!isSelected) setCourseError(''); }}
                        className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-150 text-left group ${
                          isSelected ? '' : courseError ? 'border-[#D96C5F]' : 'border-[#E2E8F0] hover:border-[#A7D1D4]'
                        }`}
                        style={isSelected ? { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBg } : undefined}
                      >
                        {/* Radio indicator */}
                        <div className="absolute top-4 right-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-transparent' : 'border-[#CBD5E1]'
                          }`} style={isSelected ? { backgroundColor: colors.icon } : undefined}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                          style={{ backgroundColor: isSelected ? colors.icon : colors.bg }}>
                          <Icon className="w-5 h-5" style={{ color: isSelected ? 'white' : colors.icon }} strokeWidth={1.8} />
                        </div>
                        <p className="text-sm font-bold mb-1 pr-6" style={{ color: isSelected ? colors.selectedText : '#1E293B' }}>{course.name}</p>
                        <p className="text-xs" style={{ color: isSelected ? colors.selectedSub : '#94A3B8' }}>{course.durationWeeks} weeks</p>
                      </button>
                    );
                  })}
                </div>
              )}
              {courseError && <p className="text-xs text-[#D96C5F] mt-3">{courseError}</p>}
            </div>

            {/* ── Step 2: Your Details ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div>
                <p className="text-xs font-bold tracking-widest text-[#1F5E63] uppercase mb-1">Step 2</p>
                <h3 className="text-lg font-bold text-[#1E293B]">Your details</h3>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldWrapper label="Full Name" required error={errors.name?.message}>
                  <StyledInput icon={User} placeholder="John Doe" error={errors.name?.message}
                    {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'At least 2 characters' }, maxLength: { value: 50, message: 'Under 50 characters' }, pattern: { value: /^[a-zA-Z\s'-]+$/, message: 'Letters only' } })} />
                </FieldWrapper>

                <FieldWrapper label="Email" required error={errors.email?.message}>
                  <StyledInput icon={Mail} type="email" placeholder="you@example.com" error={errors.email?.message}
                    {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })} />
                </FieldWrapper>

                <FieldWrapper label="Phone" required hint="We'll never share your info." error={errors.phone?.message}>
                  <StyledInput icon={Phone} type="tel" placeholder="+91 9999999999" error={errors.phone?.message}
                    {...register('phone', { validate: validatePhone })} />
                </FieldWrapper>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <FieldWrapper label="Branch / Location" required error={branchError}>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Building2 className={`w-4 h-4 ${branchError ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                    </div>
                    {branchesLoading ? (
                      <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#94A3B8] flex items-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Loading…
                      </div>
                    ) : (
                      <select
                        value={selectedBranchId}
                        onChange={(e) => { setSelectedBranchId(e.target.value); setBranchError(''); }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] focus:outline-none focus:ring-2 transition-colors appearance-none ${branchError ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'}`}
                      >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}{b.location ? ` — ${b.location}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Education Qualification" required error={errors.educationQualification?.message}>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <GraduationCap className={`w-4 h-4 ${errors.educationQualification ? 'text-[#D96C5F]' : 'text-[#94A3B8]'}`} />
                    </div>
                    <select className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] focus:outline-none focus:ring-2 transition-colors appearance-none ${errors.educationQualification ? 'border-[#D96C5F] focus:ring-[#D96C5F]/20' : 'border-[#E2E8F0] hover:border-[#A7D1D4] focus:ring-[#1F5E63]/20'}`}
                      {...register('educationQualification', { required: 'Please select your qualification' })}>
                      <option value="">Select qualification</option>
                      <option value="12th">12th</option>
                      <option value="Graduation In Any Stream">Graduation In Any Stream</option>
                      <option value="Post Graduation">Post Graduation</option>
                      <option value="Other Qualification">Other Qualification</option>
                    </select>
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Preferred Mentorship Mode" required error={errors.mentorshipMode?.message}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'online',  label: 'Online',  icon: Monitor },
                      { value: 'offline', label: 'Offline', icon: Users   },
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${watch('mentorshipMode') === value ? 'border-[#1F5E63] bg-[#E6F4F5]' : errors.mentorshipMode ? 'border-[#D96C5F]' : 'border-[#E2E8F0] hover:border-[#A7D1D4]'}`}>
                        <input type="radio" value={value} className="sr-only" {...register('mentorshipMode', { required: 'Please select a mode' })} />
                        <Icon className={`w-4 h-4 ${watch('mentorshipMode') === value ? 'text-[#1F5E63]' : 'text-[#94A3B8]'}`} strokeWidth={1.8} />
                        <span className={`text-sm font-semibold ${watch('mentorshipMode') === value ? 'text-[#1F5E63]' : 'text-[#475569]'}`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </FieldWrapper>
              </div>

              <SectionDivider label="Account Security" />

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Password" required error={errors.password?.message}>
                  <StyledInput icon={Lock} type="password" placeholder="Min. 8 characters" error={errors.password?.message}
                    {...register('password', { required: 'Password is required', validate: (val) => { const f = PASSWORD_RULES.filter(r => !r.re.test(val)); return f.length === 0 || f[0].label; } })} />
                </FieldWrapper>

                <FieldWrapper label="Confirm Password" required error={errors.confirmPassword?.message}>
                  <StyledInput icon={Lock} type="password" placeholder="Re-enter your password" error={errors.confirmPassword?.message}
                    {...register('confirmPassword', { required: 'Please confirm your password', validate: (val) => val === watch('password') || 'Passwords do not match' })} />
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

            {/* ── Step 3: Registration Fee ──────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div>
                <p className="text-xs font-bold tracking-widest text-[#1F5E63] uppercase mb-1">Step 3</p>
                <h3 className="text-lg font-bold text-[#1E293B]">Pay the Registration Fee</h3>
                <p className="text-sm text-[#475569] mt-1">
                  A one-time <span className="font-semibold text-[#1E293B]">₹1,000</span> registration fee is required. Contact us to get the payment details, make the payment, then upload the screenshot below.
                </p>
              </div>

              {/* Contact us block */}
              <div className="bg-[#F8F9FB] rounded-2xl p-4">
                <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-3">Get payment details — contact us</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://wa.me/918089272211"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Us
                  </a>
                  <a
                    href="tel:+918089272211"
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1F5E63] text-[#1F5E63] hover:bg-[#E6F4F5] font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call Us
                  </a>
                </div>
                <p className="text-xs text-[#94A3B8] text-center mt-3">
                  We'll share the UPI ID / bank details. Pay ₹1,000 and come back here to upload your screenshot.
                </p>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Payment Method <span className="text-[#D96C5F]">*</span>
                </label>
                <select
                  {...register('paymentMethod', { required: 'Please select a payment method' })}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#1F5E63] bg-white ${errors.paymentMethod ? 'border-[#D96C5F]' : 'border-[#E2E8F0]'}`}
                >
                  <option value="">Select method…</option>
                  <option value="upi">UPI (GPay · PhonePe · Paytm)</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="cash">Cash Payment</option>
                  <option value="other">Other</option>
                </select>
                {errors.paymentMethod && <p className="text-xs text-[#D96C5F] mt-1">{errors.paymentMethod.message}</p>}
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Transaction ID / UTR <span className="text-[#94A3B8] font-normal normal-case">(optional)</span>
                </label>
                <input
                  {...register('transactionId')}
                  placeholder="e.g. 123456789012"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1F5E63]"
                />
              </div>

              {/* Receipt upload */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Payment Screenshot <span className="text-[#D96C5F]">*</span>
                </label>
                {receiptPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                    <img src={receiptPreview} alt="Receipt" className="w-full max-h-56 object-contain bg-[#F8F9FB]" />
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-[#D96C5F]" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${receiptError ? 'border-[#D96C5F] bg-red-50' : 'border-[#E2E8F0] hover:border-[#1F5E63] hover:bg-[#F8F9FB]'}`}>
                    <div className="w-12 h-12 rounded-xl bg-[#E6F4F5] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-[#1F5E63]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#1E293B]">Click to upload payment screenshot</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">JPG, PNG or WebP — max 5 MB</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleReceiptFile} className="hidden" />
                  </label>
                )}
                {receiptError && <p className="text-xs text-[#D96C5F] mt-1">{receiptError}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-[#C76D64] hover:bg-[#A94E43] disabled:opacity-60 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isPending ? 'Creating account…' : 'Create Account & Continue'}
              </button>
            </div>

            {/* Below card */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
              <p className="text-xs text-[#94A3B8]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1F5E63] hover:underline font-semibold">Sign in</Link>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#94A3B8]">Have questions?</span>
                <a href="tel:+918089272211" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569] hover:text-[#1F5E63] transition-colors">
                  <PhoneCall className="w-3.5 h-3.5" /> Call us
                </a>
                <span className="text-[#E2E8F0]">|</span>
                <a href="https://wa.me/918089272211" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22A66E] hover:text-[#1a8057] transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
