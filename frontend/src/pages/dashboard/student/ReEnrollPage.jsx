import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  GraduationCap, BookOpen, CheckCircle2, Clock, ChevronRight,
  RotateCcw, AlertCircle, Sparkles,
} from 'lucide-react';
import { courseService } from '../../../services/course.service.js';
import { studentService } from '../../../services/student.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { QK } from '../../../constants/queryKeys.js';

const EDUCATION_OPTIONS = [
  '12th',
  'Graduation In Any Stream',
  'Post Graduation',
  'Other Qualification',
];

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#22C55E', bg: '#F0FDF4' },
  graduated: { label: 'Completed', color: '#CA6357', bg: '#FDEFEE' },
  dropped:   { label: 'Dropped',   color: '#D96C5F', bg: '#FBE9E7' },
};

function EnrollmentCard({ enrollment }) {
  const cfg = STATUS_CONFIG[enrollment.studentStatus] ?? STATUS_CONFIG.active;
  const date = new Date(enrollment.enrollmentDate ?? enrollment.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const graduatedAt = enrollment.graduatedAt
    ? new Date(enrollment.graduatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F1F5F9]" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-[#CA6357]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1E293B]">{enrollment.course?.name ?? 'Unknown Course'}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Enrolled {date}</p>
          </div>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
      {graduatedAt && (
        <p className="text-xs text-[#CA6357] mt-3 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          Graduated on {graduatedAt}
        </p>
      )}
      {enrollment.studentStatus !== 'graduated' && enrollment.isReEnrollment && !enrollment.isApproved && (
        <p className="text-xs text-[#F59E0B] mt-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Pending coordinator approval
        </p>
      )}
    </div>
  );
}

export default function ReEnrollPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const { data: enrollments = [], isLoading: loadingHistory } = useQuery({
    queryKey: QK.MY_ENROLLMENTS,
    queryFn: studentService.getMyEnrollments,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: QK.COURSES_ACTIVE,
    queryFn: courseService.getActive,
  });

  // Courses the student has already enrolled in (any status)
  const enrolledCourseIds = new Set(enrollments.map(e => e.course?._id?.toString()));
  const availableCourses = courses.filter(c => !enrolledCourseIds.has(c._id?.toString()));

  const pendingReEnrollment = enrollments.find(
    e => e.isReEnrollment && !e.isApproved && e.studentStatus !== 'graduated'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { mentorshipMode: 'online' } });

  const mutation = useMutation({
    mutationFn: studentService.requestReEnrollment,
    onSuccess: () => {
      toast.success('Enrollment request submitted! We\'ll notify you once approved.');
      qc.invalidateQueries({ queryKey: QK.MY_ENROLLMENTS });
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to submit request. Try again.');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      courseId: data.courseId,
      mentorshipMode: data.mentorshipMode,
      ...(data.location?.trim() ? { location: data.location.trim() } : {}),
      ...(data.educationQualification ? { educationQualification: data.educationQualification } : {}),
    };
    mutation.mutate(payload);
  };

  const isGraduated = user?.studentStatus === 'graduated';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {isGraduated ? 'Congratulations, Graduate!' : 'Course Enrollment'}
            </h1>
            <p className="text-white/70 text-sm">
              {isGraduated
                ? 'You\'ve successfully completed your course. Ready for the next step?'
                : 'Request enrollment in a new course.'}
            </p>
          </div>
        </div>
      </div>

      {/* Enrollment History */}
      <div>
        <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide mb-3">Enrollment History</h2>
        {loadingHistory ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-[#94A3B8]">Loading history…</div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-[#94A3B8]">No enrollment history found.</div>
        ) : (
          <div className="space-y-3">
            {enrollments.map(e => <EnrollmentCard key={e._id} enrollment={e} />)}
          </div>
        )}
      </div>

      {/* Pending request banner */}
      {pendingReEnrollment && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B]/30 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">Enrollment Request Pending</p>
            <p className="text-xs text-[#475569] mt-0.5">
              Your request for <strong>{pendingReEnrollment.course?.name}</strong> is awaiting coordinator approval.
              You'll receive a notification once approved.
            </p>
          </div>
        </div>
      )}

      {/* Request form — show only if no pending re-enrollment and there are available courses */}
      {!pendingReEnrollment && !submitted && (
        <div className="bg-white rounded-2xl p-6 border border-[#F1F5F9]" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#CA6357]" />
            <h2 className="text-base font-bold text-[#1E293B]">Request New Course Enrollment</h2>
          </div>

          {loadingCourses ? (
            <p className="text-sm text-[#94A3B8]">Loading available courses…</p>
          ) : availableCourses.length === 0 ? (
            <div className="flex items-start gap-3 bg-[#F8F9FB] rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#475569]">
                No new courses available at the moment. Check back later or contact your coordinator.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
                  Course <span className="text-[#D96C5F]">*</span>
                </label>
                <select
                  {...register('courseId', { required: 'Please select a course' })}
                  className="w-full border border-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357]"
                >
                  <option value="">Select a course…</option>
                  {availableCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errors.courseId && <p className="text-xs text-[#D96C5F] mt-1">{errors.courseId.message}</p>}
              </div>

              {/* Mentorship Mode */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
                  Mentorship Mode
                </label>
                <div className="flex gap-3">
                  {['online', 'offline'].map(mode => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={mode}
                        {...register('mentorshipMode')}
                        className="accent-[#CA6357]"
                      />
                      <span className="text-sm text-[#475569] capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Education Qualification */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
                  Education Qualification
                </label>
                <select
                  {...register('educationQualification')}
                  className="w-full border border-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357]"
                >
                  <option value="">Select qualification…</option>
                  {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Your city / area"
                  {...register('location')}
                  className="w-full border border-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/30 focus:border-[#CA6357] placeholder:text-[#94A3B8]"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Submit Enrollment Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Success state */}
      {submitted && (
        <div className="bg-[#F0FDF4] border border-[#22C55E]/30 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-[#22C55E] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#1E293B]">Request Submitted!</p>
            <p className="text-sm text-[#475569] mt-1">
              Your enrollment request has been sent to the coordinator for approval.
              You'll receive a notification once it's reviewed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
