import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Layers, Plus, Calendar, Users, X, Loader2,
  ToggleLeft, ToggleRight, Pencil, XCircle,
} from 'lucide-react';
import { batchService } from '../../../services/batch.service.js';
import { branchService } from '../../../services/branch.service.js';
import { courseService } from '../../../services/course.service.js';
import { staffService } from '../../../services/staff.service.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { ROLES } from '../../../constants/roles.js';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
        {label} {required && <span className="text-[#D96C5F]">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#D96C5F] mt-1">{error}</p>}
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 border rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? 'border-[#FCA5A5] focus:border-[#D96C5F] focus:ring-[#D96C5F]'
      : 'border-[#E2E8F0] focus:border-[#CA6357] focus:ring-[#CA6357]'
  }`;

function BatchFormModal({ batch, availableBranches, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!batch;

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: isEdit
      ? {
          name: batch.name,
          branch: batch.branch?._id ?? batch.branch ?? '',
          course: batch.course?._id ?? batch.course ?? '',
          startDate: batch.startDate ? batch.startDate.slice(0, 10) : '',
          endDate: batch.endDate ? batch.endDate.slice(0, 10) : '',
          maxStudents: batch.maxStudents ?? 30,
        }
      : { name: '', branch: '', course: '', startDate: '', endDate: '', maxStudents: 30 },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? batchService.update(batch._id, data) : batchService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Batch updated' : 'Batch created');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <p className="text-base font-bold text-[#1E293B]">
              {isEdit ? 'Edit Batch' : 'Create Batch'}
            </p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <Field label="Batch Name" required error={errors.name?.message}>
              <input
                {...register('name', { required: 'Batch name is required' })}
                className={inputClass(errors.name)}
                placeholder="e.g. Batch 2025 A"
              />
            </Field>

            <Field label="Branch" required error={errors.branch?.message}>
              <select
                {...register('branch', { required: 'Branch is required' })}
                className={inputClass(errors.branch)}
                disabled={isEdit}
              >
                <option value="">Select branch...</option>
                {availableBranches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {isEdit && (
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  Branch cannot be changed after creation.
                </p>
              )}
            </Field>

            <Field label="Course" required error={errors.course?.message}>
              <select
                {...register('course', { required: 'Course is required' })}
                className={inputClass(errors.course)}
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" required error={errors.startDate?.message}>
                <input
                  type="date"
                  {...register('startDate', { required: 'Start date is required' })}
                  className={inputClass(errors.startDate)}
                />
              </Field>
              <Field label="End Date" error={errors.endDate?.message}>
                <input
                  type="date"
                  {...register('endDate')}
                  className={inputClass(errors.endDate)}
                />
              </Field>
            </div>

            <Field label="Max Students" error={errors.maxStudents?.message}>
              <input
                type="number"
                {...register('maxStudents', {
                  min: { value: 1, message: 'Must be at least 1' },
                  valueAsNumber: true,
                })}
                className={inputClass(errors.maxStudents)}
                placeholder="30"
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Batch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function BatchCard({ batch, onEdit, onToggle, toggling }) {
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;

  const startDate = fmt(batch.startDate) ?? '—';
  const endDate = fmt(batch.endDate) ?? 'Ongoing';

  return (
    <div
      className={`bg-white rounded-2xl p-5 flex flex-col gap-3 transition-opacity ${
        !batch.isActive ? 'opacity-60' : ''
      }`}
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: batch.isActive ? '#FDEFEE' : '#F1F5F9' }}
          >
            <Layers
              className="w-5 h-5"
              style={{ color: batch.isActive ? '#CA6357' : '#94A3B8' }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E293B] truncate">{batch.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {batch.branch && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357]">
                  {batch.branch.code}
                </span>
              )}
              {batch.course && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2] truncate max-w-[120px]">
                  {batch.course.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            batch.isActive ? 'bg-[#E8F8F2] text-[#22A66E]' : 'bg-[#F1F5F9] text-[#94A3B8]'
          }`}
        >
          {batch.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
          <p className="text-xs text-[#475569]">
            {startDate} → {endDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
          <p className="text-xs text-[#475569]">Max {batch.maxStudents} students</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1 border-t border-[#F8F9FB]">
        <button
          onClick={() => onEdit(batch)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] text-[#475569] hover:text-[#CA6357] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button
          onClick={() => onToggle(batch)}
          disabled={toggling}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            batch.isActive
              ? 'border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#D96C5F]'
              : 'border border-[#BBF7D0] hover:bg-[#E8F8F2] text-[#22A66E]'
          }`}
        >
          {toggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : batch.isActive ? (
            <>
              <ToggleLeft className="w-3.5 h-3.5" /> Deactivate
            </>
          ) : (
            <>
              <ToggleRight className="w-3.5 h-3.5" /> Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export default function BatchesPage() {
  const { user } = useAuth();
  const isBranchAdmin = user?.role === ROLES.BRANCH_ADMIN;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const { data: profile } = useQuery({
    queryKey: ['staff', 'me'],
    queryFn: staffService.getMyProfile,
    enabled: isBranchAdmin,
  });

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
    enabled: !isBranchAdmin,
  });

  const availableBranches = isBranchAdmin ? (profile?.branches ?? []) : allBranches;

  const batchParams = useMemo(() => {
    const params = {};
    if (branchFilter) params.branch = branchFilter;
    return params;
  }, [branchFilter]);

  const { data: batches = [], isLoading, isError } = useQuery({
    queryKey: ['batches', batchParams],
    queryFn: () => batchService.getAll(batchParams),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => batchService.toggleActive(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => {
      toast.success('Batch status updated');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
    onSettled: () => setTogglingId(null),
  });

  const filtered = batches.filter((b) => {
    if (statusFilter === 'active') return b.isActive;
    if (statusFilter === 'inactive') return !b.isActive;
    return true;
  });

  const activeCount = batches.filter((b) => b.isActive).length;
  const inactiveCount = batches.filter((b) => !b.isActive).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Layers className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">
              Management
            </p>
            <h2 className="text-2xl font-bold text-white mb-1">Batches</h2>
            <p className="text-white/60 text-sm">
              {batches.length} batch{batches.length !== 1 ? 'es' : ''} · {activeCount} active
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Batch
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex gap-1 bg-white rounded-2xl p-1.5 flex-1"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                statusFilter === f.key
                  ? 'bg-[#CA6357] text-white'
                  : 'text-[#475569] hover:bg-[#F8F9FB]'
              }`}
            >
              {f.label}
              {f.key === 'active' && activeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    statusFilter === 'active'
                      ? 'bg-white/25 text-white'
                      : 'bg-[#FDEFEE] text-[#CA6357]'
                  }`}
                >
                  {activeCount}
                </span>
              )}
              {f.key === 'inactive' && inactiveCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    statusFilter === 'inactive'
                      ? 'bg-white/25 text-white'
                      : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}
                >
                  {inactiveCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {availableBranches.length > 1 && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#475569] bg-white focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357] sm:w-52"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
          >
            <option value="">All branches</option>
            {availableBranches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">Failed to load batches.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Layers className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">
            {batches.length === 0 ? 'No batches yet' : 'No batches match this filter'}
          </p>
          {batches.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mt-1"
            >
              <Plus className="w-4 h-4" /> Create your first batch
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((batch) => (
            <BatchCard
              key={batch._id}
              batch={batch}
              onEdit={setEditBatch}
              onToggle={(b) => toggleMutation.mutate(b._id)}
              toggling={togglingId === batch._id}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <BatchFormModal
          availableBranches={availableBranches}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editBatch && (
        <BatchFormModal
          batch={editBatch}
          availableBranches={availableBranches}
          onClose={() => setEditBatch(null)}
        />
      )}
    </div>
  );
}
