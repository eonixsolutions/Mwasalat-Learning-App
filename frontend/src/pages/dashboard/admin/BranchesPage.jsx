import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Building2, Plus, MapPin, Phone, FileText, X,
  Loader2, ToggleLeft, ToggleRight, Pencil, XCircle,
} from 'lucide-react';
import { branchService } from '../../../services/branch.service.js';

// ── Shared field component ────────────────────────────────────────────────────
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

function Input({ register, error, ...props }) {
  return (
    <input
      {...register}
      {...props}
      className={`w-full px-3 py-2.5 border rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-1 transition-colors ${
        error
          ? 'border-[#FCA5A5] focus:border-[#D96C5F] focus:ring-[#D96C5F]'
          : 'border-[#E2E8F0] focus:border-[#CA6357] focus:ring-[#CA6357]'
      }`}
    />
  );
}

// ── Create / Edit modal ───────────────────────────────────────────────────────
function BranchFormModal({ branch, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!branch;

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: isEdit
      ? { name: branch.name, location: branch.location ?? '', address: branch.address ?? '', phone: branch.phone ?? '' }
      : { name: '', code: '', location: '', address: '', phone: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => isEdit ? branchService.update(branch._id, data) : branchService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Branch updated' : 'Branch created');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-base font-bold text-[#1E293B]">{isEdit ? 'Edit Branch' : 'Create Branch'}</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <Field label="Branch Name" required error={errors.name?.message}>
              <Input
                register={register('name', { required: 'Branch name is required' })}
                placeholder="e.g. Kochi Main Branch"
                error={errors.name}
              />
            </Field>

            {!isEdit && (
              <Field label="Branch Code" required error={errors.code?.message}>
                <Input
                  register={register('code', {
                    required: 'Branch code is required',
                    pattern: { value: /^[A-Z0-9]+$/i, message: 'Alphanumeric only, no spaces' },
                  })}
                  placeholder="e.g. KCH"
                  error={errors.code}
                  style={{ textTransform: 'uppercase' }}
                />
              </Field>
            )}

            <Field label="Location" error={errors.location?.message}>
              <Input
                register={register('location')}
                placeholder="e.g. Kakkanad, Kochi"
                error={errors.location}
              />
            </Field>

            <Field label="Address" error={errors.address?.message}>
              <textarea
                {...register('address')}
                rows={2}
                placeholder="Full address..."
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357] resize-none"
              />
            </Field>

            <Field label="Phone" error={errors.phone?.message}>
              <Input
                register={register('phone', {
                  validate: (v) => {
                    if (!v) return true;
                    return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.trim())
                      || 'Enter a valid 10-digit Indian mobile number';
                  },
                })}
                placeholder="e.g. 9876543210 or +91 9876543210"
                error={errors.phone}
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
                {isEdit ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Branch card ───────────────────────────────────────────────────────────────
function BranchCard({ branch, onEdit, onToggle, toggling }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 flex flex-col gap-3 transition-opacity ${!branch.isActive ? 'opacity-60' : ''}`}
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: branch.isActive ? '#FDEFEE' : '#F1F5F9' }}>
            <Building2 className="w-5 h-5" style={{ color: branch.isActive ? '#CA6357' : '#94A3B8' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E293B] truncate">{branch.name}</p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357] mt-0.5">
              {branch.code}
            </span>
          </div>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${branch.isActive ? 'bg-[#E8F8F2] text-[#22A66E]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {branch.location && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#475569]">{branch.location}</p>
          </div>
        )}
        {branch.address && (
          <div className="flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#475569] leading-relaxed">{branch.address}</p>
          </div>
        )}
        {branch.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
            <p className="text-xs text-[#475569]">{branch.phone}</p>
          </div>
        )}
        {!branch.location && !branch.address && !branch.phone && (
          <p className="text-xs text-[#CBD5E1]">No contact details added.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1 border-t border-[#F8F9FB]">
        <button
          onClick={() => onEdit(branch)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] text-[#475569] hover:text-[#CA6357] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button
          onClick={() => onToggle(branch)}
          disabled={toggling}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            branch.isActive
              ? 'border border-[#FCA5A5] hover:bg-[#FEE2E2] text-[#D96C5F]'
              : 'border border-[#BBF7D0] hover:bg-[#E8F8F2] text-[#22A66E]'
          }`}
        >
          {toggling
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : branch.isActive
              ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
              : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      label: 'All'      },
  { key: 'active',   label: 'Active'   },
  { key: 'inactive', label: 'Inactive' },
];

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const { data: branches = [], isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => branchService.toggleActive(id),
    onMutate: (id) => setTogglingId(id),
    onSuccess: () => {
      toast.success('Branch status updated');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
    onSettled: () => setTogglingId(null),
  });

  const filtered = branches.filter((b) => {
    if (filter === 'active')   return b.isActive;
    if (filter === 'inactive') return !b.isActive;
    return true;
  });

  const activeCount   = branches.filter((b) => b.isActive).length;
  const inactiveCount = branches.filter((b) => !b.isActive).length;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Management</p>
            <h2 className="text-2xl font-bold text-white mb-1">Branches</h2>
            <p className="text-white/60 text-sm">
              {branches.length} branch{branches.length !== 1 ? 'es' : ''} · {activeCount} active
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Branch
          </button>
        </div>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.key ? 'bg-[#CA6357] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'
            }`}
          >
            {f.label}
            {f.key === 'active' && activeCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'active' ? 'bg-white/25 text-white' : 'bg-[#FDEFEE] text-[#CA6357]'}`}>
                {activeCount}
              </span>
            )}
            {f.key === 'inactive' && inactiveCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'inactive' ? 'bg-white/25 text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                {inactiveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
          <p className="text-sm text-[#94A3B8]">Failed to load branches.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Building2 className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">
            {branches.length === 0 ? 'No branches yet' : 'No branches match this filter'}
          </p>
          {branches.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mt-1"
            >
              <Plus className="w-4 h-4" /> Create your first branch
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((branch) => (
            <BranchCard
              key={branch._id}
              branch={branch}
              onEdit={setEditBranch}
              onToggle={(b) => toggleMutation.mutate(b._id)}
              toggling={togglingId === branch._id}
            />
          ))}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {showCreate && <BranchFormModal onClose={() => setShowCreate(false)} />}
      {editBranch  && <BranchFormModal branch={editBranch} onClose={() => setEditBranch(null)} />}
    </div>
  );
}
