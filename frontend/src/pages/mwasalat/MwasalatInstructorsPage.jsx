import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Loader2, X, Search, Star } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatUserTable from '../../components/mwasalat/MwasalatUserTable.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

function InviteInstructorModal({ onClose, onInvited }) {
  const { t } = useTranslation('mwasalatApp');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await mwasalatUserService.inviteInstructor(data);
      toast.success(t('instructorsPage.inviteModal.sentToast'));
      onInvited();
    } catch (err) {
      toast.error(err.response?.data?.message || t('instructorsPage.inviteModal.sendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('instructorsPage.inviteModal.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#475569] mb-5">
          {t('instructorsPage.inviteModal.body')}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.name')}</label>
            <input className={inputClass} {...register('name', { required: t('auth.errors.nameRequired') })} />
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.email')}</label>
            <input type="email" dir="ltr" className={`${inputClass} text-start`} placeholder={t('instructorsPage.inviteModal.emailPlaceholder')} {...register('email', { required: t('auth.errors.emailRequired') })} />
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t('instructorsPage.inviteModal.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MwasalatInstructorsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  const STATUS_FILTERS = [
    { value: 'all', label: t('userFilters.all') },
    { value: 'active', label: t('userFilters.active') },
    { value: 'blocked', label: t('userFilters.blocked') },
    { value: 'invited', label: t('userFilters.invited') },
  ];
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
      toast.success(instructor.isActive ? t('instructorsPage.blockedToast') : t('instructorsPage.unblockedToast'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('instructorsPage.updateFailed'));
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
      label: t('instructorsPage.columns.rating'),
      sortValue: (u) => u.avgRating ?? -1,
      render: (u) => (
        u.avgRating != null ? (
          <span className="inline-flex items-center gap-1 font-medium text-[#1E293B]">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" /> {localizeNumber(u.avgRating, i18n.language)}
          </span>
        ) : (
          <span className="text-[#94A3B8]">{t('instructorsPage.columns.noRatingsYet')}</span>
        )
      ),
    },
    {
      key: 'programs',
      label: t('instructorsPage.columns.programs'),
      sortValue: (u) => u.totalPrograms ?? 0,
      render: (u) => localizeNumber(u.totalPrograms ?? 0, i18n.language),
    },
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.instructors')}
      subtitle={t('instructorsPage.subtitle')}
      actions={canManage ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
          >
            <Mail className="w-3.5 h-3.5" /> {t('instructorsPage.inviteButton')}
          </button>
        </div>
      ) : null}
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
            <Search className="w-4 h-4 text-[#94A3B8] absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('instructorsPage.searchPlaceholder')}
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
            onMessage={canManage ? (u) => navigate(`/admin/chat?with=${u._id}`) : undefined}
            emptyLabel={instructors.length === 0 ? t('instructorsPage.emptyNoInstructors') : t('instructorsPage.emptyNoMatch')}
            linkTo={(u) => `/admin/instructors/${u._id}`}
            columns={instructorColumns}
            readOnly={!canManage}
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
