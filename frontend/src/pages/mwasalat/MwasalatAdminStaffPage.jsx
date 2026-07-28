import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Loader2, X, Search, Headphones } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { mwasalatDepartmentService } from '../../services/mwasalatDepartment.service.js';
import MwasalatUserTable from '../../components/mwasalat/MwasalatUserTable.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { MWASALAT_HIDE_SUPERVISOR_ROLE } from '../../constants/mwasalatRoles.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const ALL_STAFF_ROLES = MWASALAT_HIDE_SUPERVISOR_ROLE
  ? ['department_admin', 'it_support']
  : ['department_admin', 'supervisor', 'it_support'];
const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

function InviteStaffModal({ t, departments, onClose, onInvited }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { role: 'department_admin' } });
  const role = watch('role');

  const onSubmit = async (data) => {
    try {
      await mwasalatUserService.inviteStaff({
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.role === 'department_admin' ? data.department : undefined,
      });
      toast.success(t('adminStaff.inviteModal.sentToast'));
      onInvited();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminStaff.inviteModal.sendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('adminStaff.inviteModal.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminStaff.inviteModal.roleLabel')}</label>
            <select className={inputClass} {...register('role', { required: true })}>
              <option value="department_admin">{t('adminStaff.roles.department_admin')}</option>
              {!MWASALAT_HIDE_SUPERVISOR_ROLE && <option value="supervisor">{t('adminStaff.roles.supervisor')}</option>}
              <option value="it_support">{t('adminStaff.roles.it_support')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.name')}</label>
            <input className={inputClass} {...register('name', { required: t('auth.errors.nameRequired') })} />
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.email')}</label>
            <input type="email" dir="ltr" className={`${inputClass} text-start`} {...register('email', { required: t('auth.errors.emailRequired') })} />
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>
          {role === 'department_admin' && (
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCohorts.departmentLabel')}</label>
              <select className={inputClass} {...register('department', { required: true })}>
                <option value="">{t('adminStaff.inviteModal.selectDepartment')}</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t('adminStaff.inviteModal.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MwasalatAdminStaffPage() {
  const { t } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  // A department admin browsing their own tier's roster is redundant (there's
  // only ever themselves/peers in it) — scope their view to the staff that
  // actually report into the department: supervisors and IT support.
  const staffRoles = user?.role === 'department_admin'
    ? (MWASALAT_HIDE_SUPERVISOR_ROLE ? ['it_support'] : ['supervisor', 'it_support'])
    : ALL_STAFF_ROLES;
  const ROLE_FILTERS = [
    { value: 'all', label: t('adminStaff.allRoles') },
    ...staffRoles.map((role) => ({ value: role, label: t(`adminStaff.roles.${role}`) })),
  ];
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = () => {
    setIsLoading(true);
    Promise.all(staffRoles.map((role) => mwasalatUserService.listByRole(role)))
      .then((lists) => setStaff(lists.flat()))
      .finally(() => setIsLoading(false));
    mwasalatDepartmentService.listActive().then(setDepartments);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (member, reason) => {
    setPendingId(member._id);
    try {
      await mwasalatUserService.setActive(member._id, !member.isActive, reason);
      toast.success(member.isActive ? t('adminStaff.blockedToast') : t('adminStaff.unblockedToast'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminStaff.updateFailed'));
    } finally {
      setPendingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || statusOf(u) === statusFilter;
      const matchesQuery = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [staff, roleFilter, statusFilter, query]);

  const columns = [
    { key: 'role', label: t('adminStaff.columns.role'), render: (u) => <span className="text-[#475569]">{t(`adminStaff.roles.${u.role}`)}</span> },
    { key: 'department', label: t('adminCohorts.departmentLabel'), render: (u) => <span className="text-[#475569]">{u.department?.name ?? '—'}</span> },
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.staff')}
      subtitle={t('adminStaff.subtitle')}
      actions={canManage ? (
        <button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs">
          <Mail className="w-3.5 h-3.5" /> {t('adminStaff.inviteButton')}
        </button>
      ) : null}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ROLE_FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => setRoleFilter(value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${roleFilter === value ? 'bg-mwasalatInk-500 text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-mwasalatInk-100'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('adminStaff.searchPlaceholder')} className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors" />
          </div>
        </div>

        <div className="card overflow-hidden">
          {staff.length === 0 && !isLoading ? (
            <div className="p-10 text-center text-[#94A3B8]">
              <Headphones className="w-8 h-8 mx-auto mb-3 text-[#CBD5E1]" />
              <p className="text-sm">{t('adminStaff.emptyNoStaff')}</p>
            </div>
          ) : (
            <MwasalatUserTable
              users={filtered}
              isLoading={isLoading}
              pendingId={pendingId}
              onToggle={handleToggle}
              onMessage={canManage ? (u) => navigate(`/admin/chat?with=${u._id}`) : undefined}
              emptyLabel={t('adminStaff.emptyNoMatch')}
              columns={columns}
              readOnly={!canManage}
            />
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteStaffModal
          t={t}
          departments={departments}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => { setShowInviteModal(false); load(); }}
        />
      )}
    </MwasalatAdminLayout>
  );
}
