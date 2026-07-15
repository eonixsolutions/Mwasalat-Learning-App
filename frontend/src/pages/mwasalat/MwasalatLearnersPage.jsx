import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import MwasalatUserTable from '../../components/mwasalat/MwasalatUserTable.jsx';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

export default function MwasalatLearnersPage() {
  const [learners, setLearners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = () => {
    setIsLoading(true);
    mwasalatUserService.listByRole('learner')
      .then(setLearners)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (learner, reason) => {
    setPendingId(learner._id);
    try {
      await mwasalatUserService.setActive(learner._id, !learner.isActive, reason);
      toast.success(learner.isActive ? 'Learner blocked' : 'Learner unblocked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update learner');
    } finally {
      setPendingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return learners.filter((u) => {
      const matchesStatus = statusFilter === 'all' || statusOf(u) === statusFilter;
      const matchesQuery = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [learners, statusFilter, query]);

  return (
    <MwasalatAdminLayout title="Learners" subtitle="Learners who self-registered on the platform">
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
            emptyLabel={learners.length === 0 ? 'No learner accounts yet.' : 'No learners match this filter.'}
            linkTo={(u) => `/mwasalat/admin/learners/${u._id}`}
          />
        </div>
      </div>
    </MwasalatAdminLayout>
  );
}
