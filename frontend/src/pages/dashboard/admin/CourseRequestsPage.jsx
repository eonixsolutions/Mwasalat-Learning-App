import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import Modal from '../../../components/ui/Modal.jsx';
import { courseRequestService } from '../../../services/courseRequest.service.js';

const STATUS_STYLES = {
  pending:  { bg: 'bg-[#FFFBEB] text-[#F59E0B]',  label: 'Pending'  },
  approved: { bg: 'bg-[#E8F8F2] text-[#22A66E]',  label: 'Approved' },
  rejected: { bg: 'bg-[#FBE9E7] text-[#D96C5F]',  label: 'Rejected' },
};

const TYPE_LABELS = {
  change_course: 'Change Course',
  add_course:    'Add Course',
};

function ReviewModal({ request, onClose }) {
  const queryClient = useQueryClient();
  const [adminNote, setAdminNote] = useState('');

  const { mutate, isPending, variables } = useMutation({
    mutationFn: ({ action }) => courseRequestService.review({ id: request._id, action, adminNote }),
    onSuccess: (_, { action }) => {
      toast.success(`Request ${action}d`);
      queryClient.invalidateQueries({ queryKey: ['courseRequests', 'admin'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <Modal isOpen onClose={onClose} title="Review Request">
      <div className="space-y-4">
        <div className="bg-[#F8F9FB] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Student</span>
            <span className="text-sm font-semibold text-[#1E293B]">{request.user?.name}</span>
            <span className="text-xs text-[#94A3B8]">{request.user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Type</span>
            <span className="text-sm text-[#475569]">{TYPE_LABELS[request.type]}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Course</span>
            {request.currentCourse && (
              <>
                <span className="text-sm font-medium text-[#475569]">{request.currentCourse.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </>
            )}
            <span className="text-sm font-semibold text-[#CA6357]">{request.requestedCourse?.name}</span>
          </div>
          {request.reason && (
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">Reason</span>
              <p className="text-sm text-[#475569]">{request.reason}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
            Note to student <span className="text-[#94A3B8] font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Approved — batch starts Monday"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#F2B3AC] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 resize-none transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => mutate({ action: 'reject' })}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#F2B3AC] text-[#D96C5F] text-sm font-semibold hover:bg-[#FBE9E7] disabled:opacity-60 transition-colors"
          >
            {isPending && variables?.action === 'reject' && <Loader2 className="w-4 h-4 animate-spin" />}
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => mutate({ action: 'approve' })}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {isPending && variables?.action === 'approve' && <Loader2 className="w-4 h-4 animate-spin" />}
            <CheckCircle className="w-4 h-4" /> Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function CourseRequestsPage() {
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['courseRequests', 'admin', filter],
    queryFn: () => courseRequestService.getAll(filter || undefined),
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">

      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Course Requests</h1>
            <p className="text-white/70 text-sm">Review student course change and addition requests.</p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
              <Clock className="w-3.5 h-3.5" /> {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'pending',  label: 'Pending'  },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: '',         label: 'All'      },
        ].map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-[#CA6357] text-white'
                : 'bg-white text-[#475569] hover:bg-[#F8F9FB] border border-[#E2E8F0]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl bg-[#FDEFEE] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#CA6357]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[#1E293B] mb-1">No requests</p>
          <p className="text-sm text-[#475569]">No {filter} course requests at the moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => {
            const style = STATUS_STYLES[req.status];
            return (
              <div
                key={req._id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#CA6357]" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#1E293B]">{req.user?.name}</p>
                      <span className="text-xs text-[#94A3B8]">{req.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#94A3B8]">{TYPE_LABELS[req.type]}</span>
                      {req.currentCourse && (
                        <>
                          <span className="text-xs text-[#475569] font-medium">{req.currentCourse.name}</span>
                          <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                        </>
                      )}
                      <span className="text-xs font-semibold text-[#CA6357]">{req.requestedCourse?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg}`}>
                    {style.label}
                  </span>
                  {req.status === 'pending' && (
                    <button
                      onClick={() => setReviewing(req)}
                      className="px-3 py-1.5 rounded-xl bg-[#CA6357] text-white text-xs font-semibold hover:bg-[#b85548] transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewing && <ReviewModal request={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}
