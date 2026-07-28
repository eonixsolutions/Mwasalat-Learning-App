import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import MwasalatUserTable from '../../components/mwasalat/MwasalatUserTable.jsx';
import MwasalatBulkImportModal from '../../components/mwasalat/MwasalatBulkImportModal.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

// A learner counts as dormant once they've gone this many days without
// logging in — or never logged in at all despite having an active account.
const DORMANT_DAYS = 30;
const isDormant = (u) => u.isActive && (
  !u.lastLogin || Date.now() - new Date(u.lastLogin).getTime() > DORMANT_DAYS * 24 * 60 * 60 * 1000
);

export default function MwasalatLearnersPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  // Bulk import is Department Admin's alone — each row lands in their own
  // department (see bulkImport in the backend service), so it doesn't belong
  // to canManage (Platform Admin's block/unblock authority).
  const canBulkImport = user?.role === 'department_admin';
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const STATUS_FILTERS = [
    { value: 'all', label: t('userFilters.all') },
    { value: 'active', label: t('userFilters.active') },
    { value: 'blocked', label: t('userFilters.blocked') },
    { value: 'dormant', label: t('userFilters.dormant') },
  ];
  const ROLE_FILTERS = [
    { value: 'all', label: t('learnersPage.allRoles') },
    { value: 'learner', label: t('learnersPage.roles.learner') },
    { value: 'external_learner', label: t('learnersPage.roles.external_learner') },
  ];

  const learnerColumns = [
    { key: 'role', label: t('learnersPage.columns.role'), render: (u) => <span className="text-[#475569]">{t(`learnersPage.roles.${u.role}`)}</span> },
    { key: 'email', label: t('common.email'), sortValue: (u) => u.email ?? '', render: (u) => u.email },
    {
      key: 'lastActive',
      label: t('learnersPage.columns.lastActive'),
      sortValue: (u) => (u.lastLogin ? new Date(u.lastLogin).getTime() : 0),
      render: (u) => (
        u.lastLogin ? (
          <span dir="ltr" className="text-start">
            {localizeNumber(new Date(u.lastLogin).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), i18n.language)}
          </span>
        ) : (
          <span className="text-[#94A3B8]">{t('learnersPage.columns.neverLoggedIn')}</span>
        )
      ),
    },
  ];
  const [learners, setLearners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const load = () => {
    setIsLoading(true);
    Promise.all(['learner', 'external_learner'].map((role) => mwasalatUserService.listByRole(role)))
      .then((lists) => setLearners(lists.flat()))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (learner, reason) => {
    setPendingId(learner._id);
    try {
      await mwasalatUserService.setActive(learner._id, !learner.isActive, reason);
      toast.success(learner.isActive ? t('learnersPage.blockedToast') : t('learnersPage.unblockedToast'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('learnersPage.updateFailed'));
    } finally {
      setPendingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return learners.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'dormant'
          ? isDormant(u)
          : statusOf(u) === statusFilter;
      const matchesQuery = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [learners, roleFilter, statusFilter, query]);

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.learners')}
      subtitle={t('learnersPage.subtitle')}
      actions={canBulkImport ? (
        <button
          onClick={() => setShowBulkImportModal(true)}
          className="inline-flex items-center gap-2 border border-mwasalatInk-300 hover:bg-mwasalatInk-100 text-mwasalatInk-500 font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
        >
          <Upload className="w-3.5 h-3.5" /> {t('bulkImport.buttonLabel')}
        </button>
      ) : null}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {ROLE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRoleFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                roleFilter === value ? 'bg-mwasalatInk-500 text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-mwasalatInk-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
            <Search className="w-4 h-4 text-[#94A3B8] absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('learnersPage.searchPlaceholder')}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <MwasalatUserTable
            users={filtered}
            isLoading={isLoading}
            pendingId={pendingId}
            onToggle={handleToggle}
            emptyLabel={learners.length === 0 ? t('learnersPage.emptyNoAccounts') : t('learnersPage.emptyNoMatch')}
            linkTo={(u) => `/admin/learners/${u._id}`}
            columns={learnerColumns}
            readOnly={!canManage}
          />
        </div>
      </div>

      {showBulkImportModal && (
        <MwasalatBulkImportModal
          onClose={() => setShowBulkImportModal(false)}
          onImported={load}
        />
      )}
    </MwasalatAdminLayout>
  );
}
