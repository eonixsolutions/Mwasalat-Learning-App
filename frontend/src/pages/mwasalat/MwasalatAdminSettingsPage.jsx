import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader2, Save, Settings as SettingsIcon, ShieldAlert, Wrench, KeyRound } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatSettingsService } from '../../services/mwasalatSettings.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors disabled:bg-[#F8F9FB] disabled:text-[#475569]';

// Fallback for browsers without Intl.supportedValuesOf('timeZone') (Safari < 15) —
// Oman + a few other Gulf/reference zones likely to matter for this platform.
const FALLBACK_TIMEZONES = ['Asia/Muscat', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Europe/London', 'UTC'];
const TIMEZONE_OPTIONS = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : FALLBACK_TIMEZONES;

const ipListToText = (list) => (list || []).join('\n');
const textToIpList = (text) =>
  (text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export default function MwasalatAdminSettingsPage() {
  const { t } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['mwasalat-admin-settings'],
    queryFn: mwasalatSettingsService.getSettings,
  });

  const { register, handleSubmit, reset, watch } = useForm();
  const ipRestrictionEnabled = watch('ipRestrictionEnabled');
  const maintenanceModeEnabled = watch('maintenanceMode');

  useEffect(() => {
    if (settings) {
      reset({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        timezone: settings.timezone || 'Asia/Muscat',
        ipRestrictionEnabled: settings.ipRestriction?.enabled || false,
        allowedIpsText: ipListToText(settings.ipRestriction?.allowedIps),
        maintenanceMode: settings.maintenanceMode || false,
        maxLoginAttempts: settings.security?.maxLoginAttempts ?? 5,
        lockoutMinutes: settings.security?.lockoutMinutes ?? 15,
        passwordExpiryDays: settings.security?.passwordExpiryDays ?? 0,
      });
    }
  }, [settings, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      platformName, supportEmail, timezone, ipRestrictionEnabled: enabled, allowedIpsText, maintenanceMode,
      maxLoginAttempts, lockoutMinutes, passwordExpiryDays,
    }) =>
      mwasalatSettingsService.updateSettings({
        platformName,
        supportEmail,
        timezone,
        ipRestriction: { enabled, allowedIps: textToIpList(allowedIpsText) },
        maintenanceMode,
        security: {
          maxLoginAttempts: Number(maxLoginAttempts) || 5,
          lockoutMinutes: Number(lockoutMinutes) || 15,
          passwordExpiryDays: Number(passwordExpiryDays) || 0,
        },
      }),
    onSuccess: () => {
      toast.success(t('settingsPage.savedToast'));
      queryClient.invalidateQueries({ queryKey: ['mwasalat-admin-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || t('settingsPage.saveFailed')),
  });

  return (
    <MwasalatAdminLayout title={t('admin.nav.settings')} subtitle={t('settingsPage.subtitle')}>
      <div className="max-w-xl space-y-5">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('settingsPage.loading')}
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-5">
            <div className="card p-6">
              <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
                <SettingsIcon className="w-5 h-5 text-mwasalatInk-500" />
              </div>
              <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('settingsPage.platformDetailsTitle')}</h2>
              <p className="text-sm text-[#475569] mb-5">{t('settingsPage.platformDetailsSubtitle')}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.platformNameLabel')}</label>
                  <input className={inputClass} disabled={!canManage} {...register('platformName')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.supportEmailLabel')}</label>
                  <input type="email" dir="ltr" disabled={!canManage} className={`${inputClass} text-start`} placeholder={t('settingsPage.supportEmailPlaceholder')} {...register('supportEmail')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.timezoneLabel')}</label>
                  <select dir="ltr" disabled={!canManage} className={`${inputClass} text-start`} {...register('timezone')}>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('settingsPage.timezoneHint')}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="w-11 h-11 rounded-2xl bg-mwasalatRed-100 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5 text-mwasalatRed-600" />
              </div>
              <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('settingsPage.ipRestriction.title')}</h2>
              <p className="text-sm text-[#475569] mb-5">{t('settingsPage.ipRestriction.subtitle')}</p>

              <div className="space-y-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    className="w-4 h-4 rounded border-[#E2E8F0] text-mwasalatInk-500 focus:ring-mwasalatInk-500/30"
                    {...register('ipRestrictionEnabled')}
                  />
                  <span className="text-sm text-[#1E293B]">{t('settingsPage.ipRestriction.enableLabel')}</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.ipRestriction.allowedIpsLabel')}</label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    disabled={!canManage}
                    className={`${inputClass} text-start font-mono resize-y`}
                    placeholder={t('settingsPage.ipRestriction.allowedIpsPlaceholder')}
                    {...register('allowedIpsText')}
                  />
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('settingsPage.ipRestriction.allowedIpsHint')}</p>
                </div>

                {ipRestrictionEnabled && (
                  <p className="text-xs text-mwasalatRed-600 bg-mwasalatRed-100 rounded-xl px-3.5 py-2.5">
                    {t('settingsPage.ipRestriction.enabledWarning')}
                  </p>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
                <KeyRound className="w-5 h-5 text-mwasalatInk-500" />
              </div>
              <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('settingsPage.loginSecurity.title')}</h2>
              <p className="text-sm text-[#475569] mb-5">{t('settingsPage.loginSecurity.subtitle')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.loginSecurity.maxAttemptsLabel')}</label>
                  <input type="number" min={3} dir="ltr" disabled={!canManage} className={`${inputClass} text-start`} {...register('maxLoginAttempts', { min: 3 })} />
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('settingsPage.loginSecurity.maxAttemptsHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.loginSecurity.lockoutMinutesLabel')}</label>
                  <input type="number" min={1} dir="ltr" disabled={!canManage} className={`${inputClass} text-start`} {...register('lockoutMinutes', { min: 1 })} />
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('settingsPage.loginSecurity.lockoutMinutesHint')}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('settingsPage.loginSecurity.passwordExpiryLabel')}</label>
                  <input type="number" min={0} dir="ltr" disabled={!canManage} className={`${inputClass} text-start`} {...register('passwordExpiryDays', { min: 0 })} />
                  <p className="text-xs text-[#94A3B8] mt-1.5">{t('settingsPage.loginSecurity.passwordExpiryHint')}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="w-11 h-11 rounded-2xl bg-mwasalatRed-100 flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5 text-mwasalatRed-600" />
              </div>
              <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('settingsPage.maintenanceMode.title')}</h2>
              <p className="text-sm text-[#475569] mb-5">{t('settingsPage.maintenanceMode.subtitle')}</p>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManage}
                  className="w-4 h-4 rounded border-[#E2E8F0] text-mwasalatRed-600 focus:ring-mwasalatRed-500/30"
                  {...register('maintenanceMode')}
                />
                <span className="text-sm text-[#1E293B]">{t('settingsPage.maintenanceMode.enableLabel')}</span>
              </label>

              {maintenanceModeEnabled && (
                <p className="text-xs text-mwasalatRed-600 bg-mwasalatRed-100 rounded-xl px-3.5 py-2.5 mt-4">
                  {t('settingsPage.maintenanceMode.enabledWarning')}
                </p>
              )}
            </div>

            {canManage && (
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('common.save')}
              </button>
            )}
          </form>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
