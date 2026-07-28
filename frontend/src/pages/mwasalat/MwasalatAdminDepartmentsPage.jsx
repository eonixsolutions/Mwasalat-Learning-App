import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Building2, Plus, Loader2, Pencil, Trash2, X } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatDepartmentService } from '../../services/mwasalatDepartment.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';
const textareaClass = `${inputClass} resize-none`;

export default function MwasalatAdminDepartmentsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setIsLoading(true);
    mwasalatDepartmentService.list().then(setDepartments).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (data) => {
    setIsSaving(true);
    try {
      await mwasalatDepartmentService.create({
        name: data.name.trim(),
        nameAr: data.nameAr?.trim(),
        description: data.description?.trim(),
      });
      toast.success(t('adminDepartments.createdToast'));
      setIsCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminDepartments.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const onEditSave = async (data) => {
    setIsSaving(true);
    try {
      await mwasalatDepartmentService.update(editing._id, {
        name: data.editName.trim(),
        nameAr: data.editNameAr?.trim(),
        description: data.editDescription?.trim(),
      });
      toast.success(t('adminDepartments.updatedToast'));
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminDepartments.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (department) => {
    if (!canManage) return;
    try {
      await mwasalatDepartmentService.update(department._id, { isActive: !department.isActive });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminDepartments.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await mwasalatDepartmentService.remove(deleting._id);
      toast.success(t('adminDepartments.deletedToast'));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminDepartments.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const COLUMNS = [
    { key: 'name', label: t('adminDepartments.columns.name'), render: (d) => <p className="font-medium text-[#1E293B]">{d.name}</p> },
    { key: 'nameAr', label: t('adminDepartments.columns.nameAr'), render: (d) => <span dir="rtl" className="text-[#475569]">{d.nameAr || '—'}</span> },
    { key: 'memberCount', label: t('adminDepartments.columns.members'), render: (d) => <span className="text-[#475569]">{localizeNumber(d.memberCount, i18n.language)}</span> },
    {
      key: 'isActive',
      label: t('adminDepartments.columns.status'),
      render: (d) => canManage ? (
        <button
          type="button"
          onClick={() => handleToggleActive(d)}
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${d.isActive ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'}`}
        >
          {d.isActive ? t('adminDepartments.active') : t('adminDepartments.inactive')}
        </button>
      ) : (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${d.isActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#475569]'}`}>
          {d.isActive ? t('adminDepartments.active') : t('adminDepartments.inactive')}
        </span>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => setEditing(d)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-mwasalatInk-100 transition-colors" title={t('common.edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setDeleting(d)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatRed-600 border border-[#E2E8F0] hover:border-mwasalatRed-300 hover:bg-mwasalatRed-100 transition-colors" title={t('common.delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.departments')}
      subtitle={t('adminDepartments.subtitle')}
      actions={canManage ? (
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs">
          <Plus className="w-3.5 h-3.5" /> {t('adminDepartments.addCta')}
        </button>
      ) : null}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={departments}
          isLoading={isLoading}
          emptyLabel={t('adminDepartments.empty')}
          searchPlaceholder={t('adminDepartments.searchPlaceholder')}
          searchable={(d) => `${d.name} ${d.nameAr ?? ''}`}
        />
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-mwasalatInk-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">{t('adminDepartments.createTitle')}</h3>
                  <p className="text-xs text-[#475569]">{t('adminDepartments.createSubtitle')}</p>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <CreateDepartmentForm t={t} onSave={onCreate} isSaving={isSaving} onCancel={() => setIsCreateOpen(false)} />
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1E293B]">{t('adminDepartments.editModal.title')}</h3>
              <button onClick={() => setEditing(null)} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <EditDepartmentForm t={t} department={editing} onSave={onEditSave} isSaving={isSaving} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{t('adminDepartments.deleteModal.title')}</h3>
            <p className="text-sm text-[#475569] mb-5">{t('adminDepartments.deleteModal.body', { name: deleting.name })}</p>
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

function CreateDepartmentForm({ t, onSave, isSaving, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <input className={inputClass} placeholder={t('adminDepartments.namePlaceholder')} {...register('name', { required: t('adminDepartments.nameRequired') })} />
          {errors.name && <p className="text-xs text-mwasalatRed-500 mt-1">{errors.name.message}</p>}
        </div>
        <input dir="rtl" className={inputClass} placeholder={t('adminDepartments.nameArPlaceholder')} {...register('nameAr')} />
      </div>
      <textarea rows={2} className={textareaClass} placeholder={t('adminDepartments.descriptionPlaceholder')} {...register('description')} />
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('adminDepartments.addCta')}
        </button>
      </div>
    </form>
  );
}

function EditDepartmentForm({ t, department, onSave, isSaving, onCancel }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      editName: department.name,
      editNameAr: department.nameAr ?? '',
      editDescription: department.description ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminDepartments.columns.name')}</label>
        <input className={inputClass} {...register('editName', { required: true })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminDepartments.columns.nameAr')}</label>
        <input dir="rtl" className={inputClass} {...register('editNameAr')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminDepartments.descriptionPlaceholder')}</label>
        <textarea rows={2} className={textareaClass} {...register('editDescription')} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors">
          {t('common.cancel')}
        </button>
        <button type="submit" disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
        </button>
      </div>
    </form>
  );
}
