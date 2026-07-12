import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Link2, Copy, Check, Loader2,
  XCircle, ChevronDown, X, ShieldCheck, Trash2,
  Calendar, ChevronLeft, ChevronRight, Search, CheckCircle,
  MapPin, Layers, UserCog, Plus, Shield, Mail,
} from 'lucide-react';
import { staffService } from '../../../services/staff.service.js';
import { branchService } from '../../../services/branch.service.js';
import { batchService } from '../../../services/batch.service.js';

const ROLES = [
  { value: 'branch_admin',         label: 'Branch Admin'         },
  { value: 'branch_coordinator',   label: 'Branch Coordinator'   },
  { value: 'technical_mentor',     label: 'Technical Mentor'     },
  { value: 'communication_mentor', label: 'Communication Mentor' },
];

const ROLE_COLORS = {
  branch_admin:         { color: '#C76D64', bg: '#FDEFEE' },
  branch_coordinator:   { color: '#CA6357', bg: '#FDEFEE' },
  technical_mentor:     { color: '#7C6AF2', bg: '#F2EEFD' },
  communication_mentor: { color: '#F59E0B', bg: '#FFFBEB' },
};

const STAFF_TABS = [
  { key: '',                       label: 'All Staff'             },
  { key: 'branch_admin',           label: 'Branch Admins'         },
  { key: 'branch_coordinator',     label: 'Coordinators'          },
  { key: 'technical_mentor',       label: 'Technical Mentors'     },
  { key: 'communication_mentor',   label: 'Comm. Mentors'         },
];

function InitialsAvatar({ name, role }) {
  const initials = (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const cfg = ROLE_COLORS[role] ?? { color: '#94A3B8', bg: '#F1F5F9' };
  return (
    <div className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_COLORS[role] ?? { color: '#94A3B8', bg: '#F1F5F9' };
  const label = ROLES.find((r) => r.value === role)?.label ?? role;
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {label}
    </span>
  );
}

function ManageRolesModal({ member, onClose }) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('');
  const [msEmail, setMsEmail] = useState(member.microsoftEmail ?? '');
  const [editingEmail, setEditingEmail] = useState(false);
  const currentRoles = member.user?.roles ?? [member.role];

  const mutation = useMutation({
    mutationFn: ({ action, role }) => staffService.manageRoles(member._id, { action, role }),
    onSuccess: (_, { action, role }) => {
      toast.success(action === 'add' ? `${ROLES.find(r => r.value === role)?.label} role added` : 'Role removed');
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['staff', 'approvals'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update roles'),
  });

  const emailMutation = useMutation({
    mutationFn: (email) => staffService.setMicrosoftEmail(member._id, email),
    onSuccess: (_, email) => {
      toast.success('Microsoft email saved');
      setMsEmail(email);
      setEditingEmail(false);
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to save email'),
  });

  const assignableRoles = ROLES.filter((r) => !currentRoles.includes(r.value));

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-base font-bold text-[#1E293B]">Manage Roles</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4">{member.user?.name}</p>

          {/* Microsoft email */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Microsoft Account Email</p>
            {editingEmail ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={msEmail}
                  onChange={(e) => setMsEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                  className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357]"
                />
                <button
                  onClick={() => msEmail && emailMutation.mutate(msEmail)}
                  disabled={!msEmail || emailMutation.isPending}
                  className="px-3 py-2 bg-[#CA6357] hover:bg-[#b85548] text-white rounded-xl text-xs font-semibold disabled:opacity-60"
                >
                  {emailMutation.isPending ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingEmail(false); setMsEmail(member.microsoftEmail ?? ''); }}
                  className="px-2 py-2 border border-[#E2E8F0] text-[#475569] rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
                  <span className="text-sm text-[#475569] truncate">
                    {msEmail || <span className="text-[#CBD5E1] italic text-xs">Not set — staff won't get OneDrive access</span>}
                  </span>
                </div>
                <button onClick={() => setEditingEmail(true)} className="text-xs text-[#CA6357] font-semibold hover:underline flex-shrink-0">
                  {msEmail ? 'Edit' : 'Set'}
                </button>
              </div>
            )}
          </div>

          {/* Current roles */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Current Roles</p>
            <div className="flex flex-wrap gap-2">
              {currentRoles.map((r) => {
                const cfg = ROLE_COLORS[r] ?? { color: '#94A3B8', bg: '#F1F5F9' };
                const label = ROLES.find((x) => x.value === r)?.label ?? r;
                return (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <Shield className="w-3 h-3" />
                    {label}
                    {currentRoles.length > 1 && (
                      <button
                        onClick={() => mutation.mutate({ action: 'remove', role: r })}
                        disabled={mutation.isPending}
                        className="ml-0.5 rounded-full hover:bg-black/10 transition-colors p-0.5 disabled:opacity-50"
                        title={`Remove ${label} role`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            {currentRoles.length === 1 && (
              <p className="text-[10px] text-[#94A3B8] mt-1.5">Can't remove the only role.</p>
            )}
          </div>

          {/* Add role */}
          {assignableRoles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Add Role</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
                  >
                    <option value="">Select role…</option>
                    {assignableRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                </div>
                <button
                  onClick={() => { if (selectedRole) { mutation.mutate({ action: 'add', role: selectedRole }); setSelectedRole(''); } }}
                  disabled={!selectedRole || mutation.isPending}
                  className="inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
                >
                  {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add
                </button>
              </div>
            </div>
          )}

          {assignableRoles.length === 0 && (
            <p className="text-xs text-[#94A3B8] bg-[#F8F9FB] rounded-xl px-3 py-2">
              This staff member already has all available roles.
            </p>
          )}

          <button onClick={onClose} className="w-full mt-5 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm">
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function InviteModal({ onClose }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: staffService.createInvite,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['staff', 'invites'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to create invite'),
  });

  const copyLink = () => {
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-base font-bold text-[#1E293B]">Create Staff Invite</p>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          {!result ? (
            <>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                    Role <span className="text-[#D96C5F]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] focus:outline-none focus:border-[#CA6357] bg-white"
                    >
                      <option value="">Select role...</option>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                    Email <span className="text-xs text-[#94A3B8] font-normal">(optional — pre-fills &amp; locks email on registration form)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="person@example.com"
                    className="w-full pl-3 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357]"
                  />
                </div>

                <p className="text-xs text-[#94A3B8]">Invite link expires in 7 days and can only be used once.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => mutate({ role, email: email || undefined })}
                  disabled={!role || isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Generate Link
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#FDEFEE] rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#CA6357]" />
                  <p className="text-sm font-semibold text-[#CA6357]">Invite link created</p>
                </div>
                <p className="text-xs text-[#A94E43] break-all mb-3">{result.link}</p>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">Share this link with the invitee. It expires in 7 days and can only be used once.</p>
              <button onClick={onClose} className="w-full border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function AssignModal({ member, onClose }) {
  const queryClient = useQueryClient();

  const [selBranches, setSelBranches] = useState(() =>
    (member.branches || []).map((b) => b._id ?? b)
  );
  const [selBatches, setSelBatches] = useState(() =>
    (member.batches || []).map((b) => b._id ?? b)
  );

  const { data: branchesRaw } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAll(),
  });
  const { data: batchesRaw } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll(),
  });

  const branches = branchesRaw?.branches ?? branchesRaw ?? [];
  const allBatches = batchesRaw?.batches ?? batchesRaw ?? [];
  const visibleBatches = selBranches.length > 0
    ? allBatches.filter((b) => selBranches.includes(b.branch?._id ?? b.branch))
    : allBatches;

  const { mutate, isPending } = useMutation({
    mutationFn: ({ branches: br, batches: ba }) =>
      staffService.assignStaff(member._id, { branches: br, batches: ba }),
    onSuccess: () => {
      toast.success('Assignments updated');
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to update'),
  });

  const toggleBranch = (id) => {
    const removing = selBranches.includes(id);
    setSelBranches((prev) => removing ? prev.filter((b) => b !== id) : [...prev, id]);
    if (removing) {
      const gone = allBatches.filter((b) => (b.branch?._id ?? b.branch) === id).map((b) => b._id);
      setSelBatches((prev) => prev.filter((b) => !gone.includes(b)));
    }
  };

  const toggleBatch = (id) =>
    setSelBatches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)', maxHeight: '80vh' }}
        >
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <p className="text-base font-bold text-[#1E293B]">Assign Branches &amp; Batches</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{member.user?.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8F9FB]">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-5 pr-1">
            {/* Branches */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#CA6357] mb-2">Branches</p>
              {(branches).length === 0 ? (
                <p className="text-xs text-[#94A3B8]">No branches available. Create one first.</p>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <label
                      key={branch._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#CA6357] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selBranches.includes(branch._id)}
                        onChange={() => toggleBranch(branch._id)}
                        className="accent-[#CA6357] w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B]">{branch.name}</p>
                        <p className="text-xs text-[#94A3B8]">{branch.code}{branch.location ? ` · ${branch.location}` : ''}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Batches */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#CA6357] mb-1">Batches</p>
              {selBranches.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">Select a branch above to see available batches.</p>
              ) : visibleBatches.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">No batches in the selected branches.</p>
              ) : (
                <div className="space-y-2">
                  {visibleBatches.map((batch) => (
                    <label
                      key={batch._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#7C6AF2] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selBatches.includes(batch._id)}
                        onChange={() => toggleBatch(batch._id)}
                        className="accent-[#7C6AF2] w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B]">{batch.name}</p>
                        <p className="text-xs text-[#94A3B8]">{batch.branch?.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-5 flex-shrink-0 border-t border-[#F1F5F9] pt-4">
            <button
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => mutate({ branches: selBranches, batches: selBatches })}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // section: 'staff' | 'approvals' | 'invites'
  const [section, setSection] = useState(() => {
    const s = searchParams.get('section');
    return s === 'approvals' || s === 'invites' ? s : 'staff';
  });

  // Clear the ?section param from the URL once consumed
  useEffect(() => {
    if (searchParams.has('section')) setSearchParams({}, { replace: true });
  }, []);
  const [activeRole, setActiveRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirm, setConfirm] = useState(null);    // { id, name, action: 'approve'|'reject' }
  const [assign, setAssign] = useState(null);      // full member object
  const [manageRolesMember, setManageRolesMember] = useState(null); // full member object

  const staffParams = { page, limit: 15, isApproved: 'true' };
  if (activeRole) staffParams.role = activeRole;

  const approvalParams = { page, limit: 15, isApproved: 'false' };

  const { data: staffData, isLoading: staffLoading, isError: staffError } = useQuery({
    queryKey: ['staff', 'list', staffParams],
    queryFn: () => staffService.getAll(staffParams),
    enabled: section === 'staff',
  });

  const { data: approvalsData, isLoading: approvalsLoading, isError: approvalsError } = useQuery({
    queryKey: ['staff', 'approvals', approvalParams],
    queryFn: () => staffService.getAll(approvalParams),
    enabled: section === 'approvals',
  });

  // Always fetch pending count for badge (excludes rejected)
  const { data: pendingCountData } = useQuery({
    queryKey: ['staff', 'pending-count'],
    queryFn: staffService.getPending,
  });
  const pendingCount = pendingCountData?.pagination?.total ?? 0;

  const { data: invitesData } = useQuery({
    queryKey: ['staff', 'invites'],
    queryFn: () => staffService.getInvites({ limit: 50 }),
    enabled: section === 'invites',
  });

  const revokeMutation = useMutation({
    mutationFn: staffService.revokeInvite,
    onSuccess: () => {
      toast.success('Invite revoked');
      queryClient.invalidateQueries({ queryKey: ['staff', 'invites'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to revoke'),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['staff', 'approvals'] });
    queryClient.invalidateQueries({ queryKey: ['staff', 'pending-count'] });
  };

  const approveMutation = useMutation({
    mutationFn: staffService.approveStaff,
    onSuccess: () => { toast.success('Staff member approved'); setConfirm(null); invalidateAll(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: staffService.rejectStaff,
    onSuccess: () => { toast.success('Staff member rejected'); setConfirm(null); invalidateAll(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to reject'),
  });

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.action === 'approve') approveMutation.mutate(confirm.id);
    else rejectMutation.mutate(confirm.id);
  };

  const isStaffSection = section === 'staff';
  const isApprovalsSection = section === 'approvals';
  const isInvitesSection = section === 'invites';

  const currentList = (isStaffSection ? staffData : approvalsData)?.staff ?? [];
  const pagination = (isStaffSection ? staffData : approvalsData)?.pagination ?? { total: 0, pages: 1, page: 1 };
  const isLoading = isStaffSection ? staffLoading : approvalsLoading;
  const isError = isStaffSection ? staffError : approvalsError;

  const filtered = search.trim()
    ? currentList.filter((s) => {
        const q = search.toLowerCase();
        return s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q);
      })
    : currentList;

  const invites = invitesData?.invites ?? [];
  const activeInvites = invites.filter((i) => !i.isUsed && !i.isRevoked && new Date(i.expiresAt) > new Date());

  const switchSection = (s) => { setSection(s); setPage(1); setSearch(''); setActiveRole(''); };

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-1">Management</p>
            <h2 className="text-2xl font-bold text-white mb-1">Staff</h2>
            <p className="text-white/60 text-sm">{pagination.total} staff member{pagination.total !== 1 ? 's' : ''} registered</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Invite Staff
          </button>
        </div>
      </div>

      {/* ── Section tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <button onClick={() => switchSection('staff')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${section === 'staff' ? 'bg-[#CA6357] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
          Staff
        </button>
        <button onClick={() => switchSection('approvals')}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${section === 'approvals' ? 'bg-[#F59E0B] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
          Approvals
          {pendingCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === 'approvals' ? 'bg-white/30 text-white' : 'bg-[#FDE68A] text-[#92400E]'}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => switchSection('invites')}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${section === 'invites' ? 'bg-[#7C6AF2] text-white' : 'text-[#475569] hover:bg-[#F8F9FB]'}`}>
          <Link2 className="w-3.5 h-3.5" /> Invites
          {activeInvites.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === 'invites' ? 'bg-white/30 text-white' : 'bg-[#F2EEFD] text-[#7C6AF2]'}`}>
              {activeInvites.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Role sub-tabs (staff section only) ─────────────────────── */}
      {isStaffSection && (
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 overflow-x-auto" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          {STAFF_TABS.map((tab) => (
            <button key={tab.key}
              onClick={() => { setActiveRole(tab.key); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeRole === tab.key ? 'bg-[#FDEFEE] text-[#CA6357]' : 'text-[#475569] hover:bg-[#F8F9FB]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Invites panel ──────────────────────────────────────────── */}
      {isInvitesSection && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="px-6 py-4 border-b border-[#F1F5F9]">
            <p className="text-sm font-bold text-[#1E293B]">Invite Links</p>
          </div>
          {invites.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-[#94A3B8]">No invites created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F8F9FB]">
              {invites.map((invite) => {
                const isActive = !invite.isUsed && !invite.isRevoked && new Date(invite.expiresAt) > new Date();
                const status = invite.isRevoked ? 'Revoked' : invite.isUsed ? 'Used' : new Date(invite.expiresAt) < new Date() ? 'Expired' : 'Active';
                const statusColor = isActive ? '#22A66E' : '#94A3B8';
                const statusBg = isActive ? '#E8F8F2' : '#F1F5F9';
                const link = `${window.location.origin}/register/staff?token=${invite.token}`;
                return (
                  <div key={invite._id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RoleBadge role={invite.role} />
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusBg, color: statusColor }}>
                          {status}
                        </span>
                        {invite.email && <span className="text-xs text-[#94A3B8]">→ {invite.email}</span>}
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{link}</p>
                      <p className="text-[10px] text-[#CBD5E1] mt-0.5">
                        by {invite.createdBy?.name} · expires {new Date(invite.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {invite.usedBy && ` · used by ${invite.usedBy.name}`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isActive && (
                        <>
                          <button
                            onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied'); }}
                            className="p-1.5 rounded-lg bg-[#F8F9FB] hover:bg-[#FDEFEE] text-[#94A3B8] hover:text-[#CA6357] transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => revokeMutation.mutate(invite._id)}
                            disabled={revokeMutation.isPending}
                            className="p-1.5 rounded-lg bg-[#F8F9FB] hover:bg-[#FDEFEE] text-[#94A3B8] hover:text-[#C76D64] transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Search (staff + approvals only) ────────────────────────── */}
      {!isInvitesSection && <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] focus:ring-1 focus:ring-[#CA6357]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-[#94A3B8]" />
            </button>
          )}
        </div>
      </div>}

      {/* ── Staff / Approvals list ──────────────────────────────────── */}
      {!isInvitesSection && <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#CA6357] animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-[#FECACA]" strokeWidth={1.5} />
            <p className="text-sm text-[#94A3B8]">Failed to load staff.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-[#CBD5E1]" strokeWidth={1.5} />
            <p className="text-base font-bold text-[#1E293B]">No staff found</p>
            <p className="text-sm text-[#94A3B8]">
              {pagination.total === 0
                ? isApprovalsSection ? 'No pending approvals.' : 'Invite staff members to get started.'
                : 'Try adjusting your search.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#F8F9FB]">
              {filtered.map((member) => (
                <div key={member._id} className={`flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAFA] transition-colors ${member.isRejected ? 'bg-[#FFF5F5]' : !member.isApproved ? 'bg-[#FFFBEB]' : ''}`}>
                  <InitialsAvatar name={member.user?.name} role={member.role} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1E293B]">{member.user?.name ?? '—'}</p>
                      {(member.user?.roles?.length > 0 ? member.user.roles : [member.role]).map((r) => (
                        <RoleBadge key={r} role={r} />
                      ))}
                      {!member.isApproved && !member.isRejected && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]">
                          Pending Approval
                        </span>
                      )}
                      {member.isRejected && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#D96C5F]">
                          Rejected
                        </span>
                      )}
                      {member.isApproved && (member.user?.roles ?? [member.role]).includes('technical_mentor') && !member.microsoftEmail && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                          ⚠ No Microsoft Email
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8]">{member.user?.email ?? '—'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {member.invitedBy && (
                        <span className="text-xs text-[#CBD5E1]">invited by {member.invitedBy.name}</span>
                      )}
                    </div>
                    {/* Branch & batch tags — approved staff only */}
                    {member.isApproved && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {(member.branches || []).map((b) => (
                          <span
                            key={b._id}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FDEFEE] text-[#CA6357]"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {b.code ?? b.name}
                          </span>
                        ))}
                        {(member.batches || []).length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2EEFD] text-[#7C6AF2]">
                            <Layers className="w-2.5 h-2.5" />
                            {member.batches.length} batch{member.batches.length !== 1 ? 'es' : ''}
                          </span>
                        )}
                        {(member.branches || []).length === 0 && (member.batches || []).length === 0 && (
                          <span className="text-[10px] text-[#CBD5E1]">No assignments yet</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!member.isApproved && !member.isRejected && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirm({ id: member._id, name: member.user?.name, action: 'approve' })}
                        className="inline-flex items-center gap-1.5 bg-[#22A66E] hover:bg-[#1a8f5c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => setConfirm({ id: member._id, name: member.user?.name, action: 'reject' })}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FEE2E2] text-[#D96C5F] border border-[#FCA5A5] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                  {member.isApproved && isStaffSection && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setManageRolesMember(member)}
                        className="inline-flex items-center gap-1.5 border border-[#E2E8F0] hover:border-[#7C6AF2] hover:bg-[#F2EEFD] text-[#475569] hover:text-[#7C6AF2] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" /> Roles
                      </button>
                      <button
                        onClick={() => setAssign(member)}
                        className="inline-flex items-center gap-1.5 border border-[#E2E8F0] hover:border-[#CA6357] hover:bg-[#FDEFEE] text-[#475569] hover:text-[#CA6357] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <UserCog className="w-3.5 h-3.5" /> Assign
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9]">
                <p className="text-xs text-[#94A3B8]">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-[#475569]" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#CA6357] disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-4 h-4 text-[#475569]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>}

      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
      {assign && <AssignModal member={assign} onClose={() => setAssign(null)} />}
      {manageRolesMember && <ManageRolesModal member={manageRolesMember} onClose={() => setManageRolesMember(null)} />}

      {confirm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirm.action === 'approve' ? 'bg-[#E8F8F2]' : 'bg-[#FEE2E2]'}`}>
                {confirm.action === 'approve'
                  ? <CheckCircle className="w-6 h-6 text-[#22A66E]" />
                  : <XCircle className="w-6 h-6 text-[#D96C5F]" />}
              </div>
              <h3 className="text-base font-bold text-[#1E293B] text-center mb-1">
                {confirm.action === 'approve' ? 'Approve staff member?' : 'Reject staff member?'}
              </h3>
              <p className="text-sm text-[#475569] text-center mb-6">
                {confirm.action === 'approve'
                  ? <><span className="font-semibold text-[#1E293B]">{confirm.name}</span> will be able to log in and access their dashboard.</>
                  : <><span className="font-semibold text-[#1E293B]">{confirm.name}</span> will not be able to log in. This action cannot be undone.</>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 border border-[#E2E8F0] text-[#475569] font-medium px-4 py-2 rounded-xl hover:bg-[#F8F9FB] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`flex-1 inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-60 ${
                    confirm.action === 'approve'
                      ? 'bg-[#22A66E] hover:bg-[#1a8f5c]'
                      : 'bg-[#D96C5F] hover:bg-[#C45E52]'
                  }`}
                >
                  {(approveMutation.isPending || rejectMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirm.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
