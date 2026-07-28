import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatTwoFactorSettings() {
  const { t } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const [stage, setStage] = useState('idle'); // idle | setup | backupCodes | disable
  const [setupData, setSetupData] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);
  const [copied, setCopied] = useState(false);

  const enableForm = useForm();
  const disableForm = useForm();

  const { mutate: startSetup, isPending: isStartingSetup } = useMutation({
    mutationFn: mwasalatAuthService.setupTwoFactor,
    onSuccess: (data) => { setSetupData(data); setStage('setup'); },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.twoFactor.setupFailed')),
  });

  const { mutate: confirmEnable, isPending: isEnabling } = useMutation({
    mutationFn: (data) => mwasalatAuthService.enableTwoFactor(data.token),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStage('backupCodes');
      mwasalatAuthService.refreshMe();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.twoFactor.enableFailed')),
  });

  const { mutate: confirmDisable, isPending: isDisabling } = useMutation({
    mutationFn: (data) => mwasalatAuthService.disableTwoFactor(data.password),
    onSuccess: () => {
      toast.success(t('auth.twoFactor.disabledToast'));
      setStage('idle');
      disableForm.reset();
      mwasalatAuthService.refreshMe();
    },
    onError: (err) => toast.error(err.response?.data?.message || t('auth.twoFactor.disableFailed')),
  });

  const handleCopyCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    setStage('idle');
    setSetupData(null);
    setBackupCodes(null);
    enableForm.reset();
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-mwasalatInk-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">{t('auth.twoFactor.title')}</p>
          <p className="text-xs text-[#94A3B8]">{t('auth.twoFactor.subtitle')}</p>
        </div>
      </div>

      {stage === 'idle' && (
        user?.twoFactorEnabled ? (
          <div className="space-y-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full w-fit">
              <ShieldCheck className="w-3 h-3" /> {t('auth.twoFactor.enabledBadge')}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setStage('disable')}
                className="inline-flex items-center gap-2 border border-mwasalatRed-500 text-mwasalatRed-600 hover:bg-mwasalatRed-100 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <ShieldOff className="w-4 h-4" /> {t('auth.twoFactor.disableCta')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startSetup()}
            disabled={isStartingSetup}
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isStartingSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {t('auth.twoFactor.enableCta')}
          </button>
        )
      )}

      {stage === 'setup' && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">{t('auth.twoFactor.scanInstruction')}</p>
          <div className="flex justify-center bg-white p-3 rounded-xl border border-[#E2E8F0] w-fit">
            <QRCodeSVG value={setupData.otpauthUrl} size={160} />
          </div>
          <div>
            <p className="text-xs text-[#94A3B8] mb-1">{t('auth.twoFactor.manualEntryLabel')}</p>
            <p className="text-xs font-mono bg-[#F8F9FB] rounded-lg px-3 py-2 break-all" dir="ltr">{setupData.secret}</p>
          </div>
          <form onSubmit={enableForm.handleSubmit((data) => confirmEnable(data))} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.twoFactor.codeLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={6}
                placeholder={t('auth.twoFactor.codePlaceholder')}
                className={`${inputClass} text-center tracking-[0.3em] font-mono max-w-[10rem]`}
                {...enableForm.register('token', {
                  required: t('auth.twoFactor.codeRequired'),
                  pattern: { value: /^\d{6}$/, message: t('auth.resetPassword.otpInvalid') },
                })}
              />
              {enableForm.formState.errors.token && <p className="text-xs text-mwasalatRed-500 mt-1">{enableForm.formState.errors.token.message}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isEnabling}
                className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {isEnabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {t('auth.twoFactor.confirmCta')}
              </button>
              <button type="button" onClick={finishSetup} className="text-xs font-medium text-[#94A3B8] hover:text-[#475569] px-2">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {stage === 'backupCodes' && backupCodes && (
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">{t('auth.twoFactor.backupCodesIntro')}</p>
          <div className="grid grid-cols-2 gap-2 bg-[#F8F9FB] rounded-xl p-4 font-mono text-sm" dir="ltr">
            {backupCodes.map((code) => <span key={code}>{code}</span>)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyCodes}
              className="inline-flex items-center gap-2 border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('auth.twoFactor.copied') : t('auth.twoFactor.copyCodesCta')}
            </button>
            <button
              type="button"
              onClick={finishSetup}
              className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              {t('auth.twoFactor.doneCta')}
            </button>
          </div>
        </div>
      )}

      {stage === 'disable' && (
        <form onSubmit={disableForm.handleSubmit((data) => confirmDisable(data))} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('profile.currentPassword')}</label>
            <input
              type="password"
              dir="ltr"
              placeholder="••••••••"
              className={`${inputClass} text-start max-w-xs`}
              {...disableForm.register('password', { required: t('profile.currentPasswordRequired') })}
            />
            {disableForm.formState.errors.password && <p className="text-xs text-mwasalatRed-500 mt-1">{disableForm.formState.errors.password.message}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isDisabling}
              className="inline-flex items-center gap-2 bg-mwasalatRed-500 hover:bg-mwasalatRed-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isDisabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
              {t('auth.twoFactor.confirmDisableCta')}
            </button>
            <button
              type="button"
              onClick={() => { setStage('idle'); disableForm.reset(); }}
              className="text-xs font-medium text-[#94A3B8] hover:text-[#475569] px-2"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
