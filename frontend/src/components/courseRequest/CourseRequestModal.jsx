import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BookOpen, Check, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { courseService } from '../../services/course.service.js';
import { courseRequestService } from '../../services/courseRequest.service.js';

export default function CourseRequestModal({ isOpen, onClose, currentCourseId }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [type, setType] = useState('change_course');
  const [reason, setReason] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: courseService.getActive,
    enabled: isOpen,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: courseRequestService.submit,
    onSuccess: () => {
      toast.success('Request submitted — pending admin approval');
      queryClient.invalidateQueries({ queryKey: ['courseRequests', 'my'] });
      onClose();
      setSelected(null);
      setReason('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const availableCourses = courses.filter((c) =>
    type === 'add_course' ? c._id !== currentCourseId : true
  );

  const handleSubmit = () => {
    if (!selected) return toast.error('Please select a course');
    mutate({ courseId: selected._id, type, reason });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Course">
      <div className="space-y-4">

        {/* Type toggle */}
        <div>
          <p className="text-sm font-medium text-[#1E293B] mb-2">Request Type</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'change_course', label: 'Change Course' },
              { value: 'add_course',    label: 'Add Course'    },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setType(value); setSelected(null); }}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  type === value
                    ? 'border-[#CA6357] bg-[#FDEFEE] text-[#CA6357]'
                    : 'border-[#E2E8F0] text-[#475569] hover:border-[#F2B3AC]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Course picker */}
        <div>
          <p className="text-sm font-medium text-[#1E293B] mb-2">Select Course</p>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableCourses.map((course) => {
                const isSelected = selected?._id === course._id;
                const isCurrent  = course._id === currentCourseId;
                return (
                  <button
                    key={course._id}
                    type="button"
                    disabled={isCurrent && type === 'change_course'}
                    onClick={() => setSelected(isSelected ? null : course)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[#CA6357] bg-[#FDEFEE]'
                        : isCurrent && type === 'change_course'
                        ? 'border-[#E2E8F0] bg-[#F8F9FB] opacity-50 cursor-not-allowed'
                        : 'border-[#E2E8F0] hover:border-[#F2B3AC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[#CA6357]" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{course.name}</p>
                        <p className="text-xs text-[#94A3B8]">{course.durationWeeks} weeks
                          {isCurrent && ' · Current'}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#CA6357]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
            Reason <span className="text-[#94A3B8] font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you'd like to change or add a course…"
            className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#F2B3AC] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#CA6357]/25 resize-none transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8F9FB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !selected}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CA6357] hover:bg-[#b85548] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
