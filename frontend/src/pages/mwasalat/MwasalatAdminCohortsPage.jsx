import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { UsersRound, Plus, Loader2, Pencil, Trash2, X, Search } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatGroupService } from '../../services/mwasalatGroup.service.js';
import { mwasalatDepartmentService } from '../../services/mwasalatDepartment.service.js';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

function MemberPicker({ t, allLearners, selected, onChange }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allLearners;
    return allLearners.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [allLearners, query]);

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
        {t('adminCohorts.membersLabel')} <span className="text-[#94A3B8] font-normal">({localizeNumber(selected.length, 'en')} {t('adminCohorts.selected')})</span>
      </label>
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute start-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('adminCohorts.memberSearchPlaceholder')} className={`${inputClass} ps-8`} />
      </div>
      <div className="max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
        {filtered.length === 0 ? (
          <p className="text-xs text-[#94A3B8] p-3">{t('adminCohorts.noLearners')}</p>
        ) : filtered.map((u) => (
          <label key={u._id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-[#F8F9FB]">
            <input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggle(u._id)} className="w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/30" />
            <span className="text-[#1E293B]">{u.name}</span>
            <span className="text-[#94A3B8] text-xs">{u.email}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function GroupFormModal({ t, group, departments, allLearners, onClose, onSave, isSaving }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: group?.name ?? '',
      nameAr: group?.nameAr ?? '',
      description: group?.description ?? '',
      department: group?.department?._id ?? '',
    },
  });
  const [members, setMembers] = useState(group?.members?.map((m) => m._id) ?? []);

  const submit = (data) => onSave({ ...data, department: data.department || null, members });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1E293B]">{group ? t('adminCohorts.editModal.title') : t('adminCohorts.createTitle')}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder={t('adminCohorts.namePlaceholder')} {...register('name', { required: true })} />
            <input dir="rtl" className={inputClass} placeholder={t('adminCohorts.nameArPlaceholder')} {...register('nameAr')} />
          </div>
          <textarea rows={2} className={`${inputClass} resize-none`} placeholder={t('adminCohorts.descriptionPlaceholder')} {...register('description')} />
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCohorts.departmentLabel')}</label>
            <select className={inputClass} {...register('department')}>
              <option value="">{t('adminCohorts.noDepartment')}</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <MemberPicker t={t} allLearners={allLearners} selected={members} onChange={setMembers} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MwasalatAdminCohortsPage() {
  const { t } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin' || user?.role === 'department_admin';
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allLearners, setAllLearners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setIsLoading(true);
    Promise.all([
      mwasalatGroupService.list(),
      mwasalatDepartmentService.listActive(),
      mwasalatUserService.listByRole('learner'),
      mwasalatUserService.listByRole('external_learner'),
    ])
      .then(([groupList, deptList, learners, externalLearners]) => {
        setGroups(groupList);
        setDepartments(deptList);
        setAllLearners([...learners, ...externalLearners]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      if (editing) {
        await mwasalatGroupService.update(editing._id, data);
        toast.success(t('adminCohorts.updatedToast'));
      } else {
        await mwasalatGroupService.create(data);
        toast.success(t('adminCohorts.createdToast'));
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCohorts.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await mwasalatGroupService.remove(deleting._id);
      toast.success(t('adminCohorts.deletedToast'));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCohorts.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'name', label: t('adminCohorts.columns.name'), render: (g) => <p className="font-medium text-[#1E293B]">{g.name}</p> },
    { key: 'department', label: t('adminCohorts.departmentLabel'), render: (g) => <span className="text-[#475569]">{g.department?.name ?? '—'}</span> },
    { key: 'members', label: t('adminCohorts.columns.members'), render: (g) => <span className="text-[#475569]">{g.members?.length ?? 0}</span> },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (g) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => { setEditing(g); setShowForm(true); }} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-mwasalatInk-100 transition-colors" title={t('common.edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setDeleting(g)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatRed-600 border border-[#E2E8F0] hover:border-mwasalatRed-300 hover:bg-mwasalatRed-100 transition-colors" title={t('common.delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.cohorts')}
      subtitle={t('adminCohorts.subtitle')}
      actions={canManage ? (
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs">
          <Plus className="w-3.5 h-3.5" /> {t('adminCohorts.addCta')}
        </button>
      ) : null}
    >
      <div className="max-w-4xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={groups}
          isLoading={isLoading}
          emptyLabel={t('adminCohorts.empty')}
          searchPlaceholder={t('adminCohorts.searchPlaceholder')}
          searchable={(g) => `${g.name} ${g.nameAr ?? ''}`}
        />
      </div>

      {showForm && (
        <GroupFormModal
          t={t}
          group={editing}
          departments={departments}
          allLearners={allLearners}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{t('adminCohorts.deleteModal.title')}</h3>
            <p className="text-sm text-[#475569] mb-5">{t('adminCohorts.deleteModal.body', { name: deleting.name })}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MwasalatAdminLayout>
  );
}
