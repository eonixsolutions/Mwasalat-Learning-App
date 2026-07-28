import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Tags, Plus, Loader2, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatCategoryService } from '../../services/mwasalatCategory.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';
const textareaClass = `${inputClass} resize-none`;

// Shared by the create form and the edit modal — a chip list of {name, nameAr}
// rows plus a manual add row, so the AI's starter suggestions stay fully
// editable (add/remove/rename) before the admin saves.
function SubCategoryEditor({ t, value, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (value.some((s) => s.name.toLowerCase() === name.toLowerCase())) { setDraft(''); return; }
    onChange([...value, { name }]);
    setDraft('');
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCategories.subCategories.label')}</label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((s, idx) => (
            <span key={`${s.name}-${idx}`} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-mwasalatInk-100 text-mwasalatInk-500">
              {s.name}
              <button type="button" onClick={() => remove(idx)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-mwasalatInk-200 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={t('adminCategories.subCategories.addPlaceholder')}
          className={inputClass}
        />
        <button type="button" onClick={add} className="px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors whitespace-nowrap">
          {t('adminCategories.subCategories.addCta')}
        </button>
      </div>
    </div>
  );
}

export default function MwasalatAdminCategoriesPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setIsLoading(true);
    mwasalatCategoryService.list().then(setCategories).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (data, subCategories) => {
    setIsSaving(true);
    try {
      await mwasalatCategoryService.create({
        name: data.name.trim(),
        nameAr: data.nameAr?.trim(),
        description: data.description?.trim(),
        descriptionAr: data.descriptionAr?.trim(),
        subCategories,
      });
      toast.success(t('adminCategories.createdToast'));
      setIsCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCategories.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const onEditSave = async (data) => {
    setIsSaving(true);
    try {
      await mwasalatCategoryService.update(editing._id, {
        name: data.editName.trim(),
        nameAr: data.editNameAr?.trim(),
        description: data.editDescription?.trim(),
        descriptionAr: data.editDescriptionAr?.trim(),
        subCategories: editing.subCategories,
      });
      toast.success(t('adminCategories.updatedToast'));
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCategories.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    if (!canManage) return;
    try {
      await mwasalatCategoryService.update(category._id, { isActive: !category.isActive });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCategories.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await mwasalatCategoryService.remove(deleting._id);
      toast.success(t('adminCategories.deletedToast'));
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCategories.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const COLUMNS = [
    {
      key: 'name',
      label: t('adminCategories.columns.name'),
      render: (c) => <p className="font-medium text-[#1E293B]">{c.name}</p>,
    },
    {
      key: 'nameAr',
      label: t('adminCategories.columns.nameAr'),
      render: (c) => <span dir="rtl" className="text-[#475569]">{c.nameAr || '—'}</span>,
    },
    {
      key: 'subCategories',
      label: t('adminCategories.subCategories.label'),
      render: (c) => (
        c.subCategories?.length ? (
          <span className="text-[#475569]">{c.subCategories.map((s) => s.name).join(', ')}</span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        )
      ),
    },
    {
      key: 'programCount',
      label: t('adminCategories.columns.courseCount'),
      render: (c) => <span className="text-[#475569]">{localizeNumber(c.programCount, i18n.language)}</span>,
    },
    {
      key: 'isActive',
      label: t('adminCategories.columns.status'),
      render: (c) => (
        canManage ? (
          <button
            type="button"
            onClick={() => handleToggleActive(c)}
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              c.isActive ? 'bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
            }`}
          >
            {c.isActive ? t('adminCategories.active') : t('adminCategories.inactive')}
          </button>
        ) : (
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            c.isActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#475569]'
          }`}>
            {c.isActive ? t('adminCategories.active') : t('adminCategories.inactive')}
          </span>
        )
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(c)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatInk-500 border border-[#E2E8F0] hover:border-mwasalatInk-300 hover:bg-mwasalatInk-100 transition-colors"
            title={t('common.edit')}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(c)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-mwasalatRed-600 border border-[#E2E8F0] hover:border-mwasalatRed-300 hover:bg-mwasalatRed-100 transition-colors"
            title={t('common.delete')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <MwasalatAdminLayout
      title={t('admin.nav.categories')}
      subtitle={t('adminCategories.subtitle')}
      actions={canManage ? (
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs">
          <Plus className="w-3.5 h-3.5" /> {t('adminCategories.addCta')}
        </button>
      ) : null}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={categories}
          isLoading={isLoading}
          emptyLabel={t('adminCategories.empty')}
          searchPlaceholder={t('adminCategories.searchPlaceholder')}
          searchable={(c) => `${c.name} ${c.nameAr ?? ''}`}
        />
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center shrink-0">
                  <Tags className="w-4.5 h-4.5 text-mwasalatInk-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">{t('adminCategories.createTitle')}</h3>
                  <p className="text-xs text-[#475569]">{t('adminCategories.createSubtitle')}</p>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <CreateCategoryForm t={t} onSave={onCreate} isSaving={isSaving} onCancel={() => setIsCreateOpen(false)} />
          </div>
        </div>
      )}

      {editing && (
        <EditCategoryModal
          category={editing}
          onClose={() => setEditing(null)}
          onSave={onEditSave}
          onSubCategoriesChange={(subs) => setEditing({ ...editing, subCategories: subs })}
          isSaving={isSaving}
          t={t}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{t('adminCategories.deleteModal.title')}</h3>
            <p className="text-sm text-[#475569] mb-5">
              {t('adminCategories.deleteModal.body', { name: deleting.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatRed-600 hover:bg-mwasalatRed-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
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

function CreateCategoryForm({ t, onSave, isSaving, onCancel }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [subCategories, setSubCategories] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = async () => {
    const name = watch('name')?.trim();
    if (!name) { toast.error(t('adminCategories.suggest.nameRequired')); return; }
    setIsSuggesting(true);
    try {
      const suggestion = await mwasalatCategoryService.suggest(name);
      setValue('description', suggestion.description);
      setSubCategories(suggestion.subCategories.map((s) => ({ name: s })));
      toast.success(t('adminCategories.suggest.appliedToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('adminCategories.suggest.failed'));
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit((data) => onSave(data, subCategories))} className="space-y-4">
      <div className="grid gap-3 items-start">
        <div>
          <input
            className={inputClass}
            placeholder={t('adminCategories.namePlaceholder')}
            {...register('name', { required: t('adminCategories.nameRequired') })}
          />
          {errors.name && <p className="text-xs text-mwasalatRed-500 mt-1">{errors.name.message}</p>}
        </div>
        <input dir="rtl" className={inputClass} placeholder={t('adminCategories.nameArPlaceholder')} {...register('nameAr')} />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={isSuggesting}
          className="inline-flex items-center justify-center gap-2 border border-mwasalatInk-300 hover:bg-mwasalatInk-100 disabled:opacity-60 text-mwasalatInk-500 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {t('adminCategories.suggest.cta')}
        </button>
      </div>

      <textarea
        rows={2}
        className={textareaClass}
        placeholder={t('adminCategories.descriptionPlaceholder')}
        {...register('description')}
      />

      <SubCategoryEditor t={t} value={subCategories} onChange={setSubCategories} />

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('adminCategories.addCta')}
        </button>
      </div>
    </form>
  );
}

function EditCategoryModal({ category, onClose, onSave, onSubCategoriesChange, isSaving, t }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      editName: category.name,
      editNameAr: category.nameAr ?? '',
      editDescription: category.description ?? '',
      editDescriptionAr: category.descriptionAr ?? '',
    },
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('adminCategories.editModal.title')}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCategories.columns.name')}</label>
            <input className={inputClass} {...register('editName', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCategories.columns.nameAr')}</label>
            <input dir="rtl" className={inputClass} {...register('editNameAr')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('adminCategories.descriptionPlaceholder')}</label>
            <textarea rows={2} className={textareaClass} {...register('editDescription')} />
          </div>
          <SubCategoryEditor t={t} value={category.subCategories ?? []} onChange={onSubCategoriesChange} />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
