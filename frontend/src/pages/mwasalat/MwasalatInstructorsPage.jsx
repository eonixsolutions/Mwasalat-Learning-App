import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Loader2, X, Search, Star } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatUserTable from '../../components/mwasalat/MwasalatUserTable.jsx';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'invited', label: 'Invited' },
];

const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

function InviteInstructorModal({ onClose, onInvited }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await mwasalatUserService.inviteInstructor(data);
      toast.success('Invitation sent');
      onInvited();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">Invite Instructor</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#475569] mb-5">
          They'll receive an email with a link to set their own password and activate the account.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Name</label>
            <input className={inputClass} {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
            <input type="email" className={inputClass} placeholder="instructor@mwasalat.om" {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Invitation
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MwasalatInstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = () => {
    setIsLoading(true);
    Promise.all([
      mwasalatUserService.listByRole('instructor'),
      mwasalatProgramService.listInstructorSummaries(),
    ])
      .then(([users, summaries]) => {
        setInstructors(users.map((u) => ({ ...u, ...(summaries[u._id] ?? { totalPrograms: 0, avgRating: null }) })));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (instructor, reason) => {
    setPendingId(instructor._id);
    try {
      await mwasalatUserService.setActive(instructor._id, !instructor.isActive, reason);
      toast.success(instructor.isActive ? 'Instructor blocked' : 'Instructor unblocked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update instructor');
    } finally {
      setPendingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instructors.filter((u) => {
      const matchesStatus = statusFilter === 'all' || statusOf(u) === statusFilter;
      const matchesQuery = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [instructors, statusFilter, query]);

  const instructorColumns = [
    {
      key: 'rating',
      label: 'Rating',
      sortValue: (u) => u.avgRating ?? -1,
      render: (u) => (
        u.avgRating != null ? (
          <span className="inline-flex items-center gap-1 font-medium text-[#1E293B]">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" /> {u.avgRating}
          </span>
        ) : (
          <span className="text-[#94A3B8]">No ratings yet</span>
        )
      ),
    },
    {
      key: 'programs',
      label: 'Programs',
      sortValue: (u) => u.totalPrograms ?? 0,
      render: (u) => u.totalPrograms ?? 0,
    },
  ];

  return (
    <MwasalatAdminLayout
      title="Instructors"
      subtitle="Manage instructor accounts"
      actions={(
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
        >
          <Mail className="w-3.5 h-3.5" /> Invite Instructor
        </button>
      )}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === value ? 'bg-mwasalatInk-500 text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-mwasalatInk-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <MwasalatUserTable
            users={filtered}
            isLoading={isLoading}
            pendingId={pendingId}
            onToggle={handleToggle}
            emptyLabel={instructors.length === 0 ? 'No instructors yet — send an invite to get started.' : 'No instructors match this filter.'}
            linkTo={(u) => `/mwasalat/admin/instructors/${u._id}`}
            columns={instructorColumns}
          />
        </div>
      </div>

      {showInviteModal && (
        <InviteInstructorModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => { setShowInviteModal(false); load(); }}
        />
      )}
    </MwasalatAdminLayout>
  );
}
