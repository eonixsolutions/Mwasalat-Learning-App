import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatSettingsService } from '../../services/mwasalatSettings.service.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAdminSettingsPage() {
  const { t } = useTranslation('mwasalatApp');
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['mwasalat-admin-settings'],
    queryFn: mwasalatSettingsService.getSettings,
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (settings) reset({ platformName: settings.platformName, supportEmail: settings.supportEmail });
  }, [settings, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: mwasalatSettingsService.updateSettings,
    onSuccess: () => {
      toast.success(t('settingsPage.savedToast'));
      queryClient.invalidateQueries({ queryKey: ['mwasalat-admin-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || t('settingsPage.saveFailed')),
  });

  return (
    <MwasalatAdminLayout title={t('admin.nav.settings')} subtitle={t('settingsPage.subtitle')}>
      <div className="max-w-xl">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('settingsPage.loading')}
          </div>
        ) : (
          <div className="card p-6">
            <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
              <SettingsIcon className="w-5 h-5 text-mwasalatInk-500" />
            </div>
            <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('settingsPage.platformDetailsTitle')}</h2>
            <p className="text-sm text-[#475569] mb-5">{t('settingsPage.platformDetailsSubtitle')}</p>

            <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.platformNameLabel')}</label>
                <input className={inputClass} {...register('platformName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.supportEmailLabel')}</label>
                <input type="email" dir="ltr" className={`${inputClass} text-start`} placeholder={t('settingsPage.supportEmailPlaceholder')} {...register('supportEmail')} />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('common.save')}
              </button>
            </form>
          </div>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
