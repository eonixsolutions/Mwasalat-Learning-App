import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ShieldQuestion } from 'lucide-react';
import { mwasalatAuthService } from '../../services/mwasalatAuth.service.js';

// Self-contained math CAPTCHA widget: fetches a question+token pair from the
// backend, writes the token into a hidden RHF field, and lets the caller
// register the visible answer field like any other form input. On a failed
// submit, the parent should call `queryClient.invalidateQueries({ queryKey: ['mwasalat-captcha'] })`
// to force a fresh question rather than letting the user retry a stale one.
export default function MwasalatCaptcha({ register, setValue, error, tokenFieldName = 'captchaToken', answerFieldName = 'captchaAnswer' }) {
  const { t } = useTranslation('mwasalatApp');
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['mwasalat-captcha'],
    queryFn: mwasalatAuthService.getCaptcha,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.token) setValue(tokenFieldName, data.token);
  }, [data, setValue, tokenFieldName]);

  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('auth.captcha.label')}</label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] text-sm font-mono tabular-nums text-[#1E293B] select-none min-w-[6.5rem] justify-center">
          <ShieldQuestion className="w-3.5 h-3.5 text-mwasalatInk-400 shrink-0" />
          {isLoading ? '…' : data?.question}
        </div>
        <input
          type="number"
          inputMode="numeric"
          dir="ltr"
          placeholder={t('auth.captcha.placeholder')}
          className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border text-sm bg-white text-[#1E293B] text-start placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 transition-colors ${error ? 'border-[#C22033] focus:ring-[#C22033]/20' : 'border-[#E2E8F0] hover:border-mwasalatInk-300 focus:ring-mwasalatInk-500/20'}`}
          {...register(answerFieldName, { required: t('auth.captcha.required') })}
        />
        <button
          type="button"
          onClick={() => refetch()}
          title={t('auth.captcha.refresh')}
          className="p-2.5 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <input type="hidden" {...register(tokenFieldName)} />
      {error && <p className="text-xs text-[#C22033] mt-1">{error.message}</p>}
    </div>
  );
}
