import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAdminAnnouncementsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';
  const [sent, setSent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = () => {
    setIsLoading(true);
    mwasalatNotificationService.listSent().then(setSent).finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setIsSending(true);
    try {
      await mwasalatNotificationService.send({ title: data.title.trim(), message: data.message.trim() });
      toast.success(t('announcementsPage.sentToast'));
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('announcementsPage.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const COLUMNS = [
    {
      key: 'title',
      label: t('announcementsPage.columns.title'),
      render: (n) => <p className="font-medium text-[#1E293B]">{n.title}</p>,
    },
    {
      key: 'message',
      label: t('announcementsPage.columns.message'),
      render: (n) => <span className="text-[#475569] line-clamp-2">{n.message}</span>,
    },
    {
      key: 'readCount',
      label: t('announcementsPage.columns.readCount'),
      render: (n) => localizeNumber(n.readCount, i18n.language),
    },
    {
      key: 'createdAt',
      label: t('announcementsPage.columns.sentAt'),
      render: (n) => (
        <span dir="ltr" className="text-[#94A3B8]">
          {localizeNumber(new Date(n.createdAt).toLocaleString(dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), i18n.language)}
        </span>
      ),
    },
  ];

  return (
    <MwasalatAdminLayout title={t('admin.nav.announcements')} subtitle={t('announcementsPage.subtitle')}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6">
          <div className="w-11 h-11 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
            <Megaphone className="w-5 h-5 text-mwasalatInk-500" />
          </div>
          <h2 className="text-base font-bold text-[#1E293B] mb-1">{t('announcementsPage.composeTitle')}</h2>
          <p className="text-sm text-[#475569] mb-5">{t('announcementsPage.composeSubtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('announcementsPage.titleLabel')}</label>
              <input className={inputClass} {...register('title', { required: t('announcementsPage.titleRequired') })} />
              {errors.title && <p className="text-xs text-mwasalatRed-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('announcementsPage.messageLabel')}</label>
              <textarea rows={3} className={inputClass} {...register('message', { required: t('announcementsPage.messageRequired') })} />
              {errors.message && <p className="text-xs text-mwasalatRed-500 mt-1">{errors.message.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? t('announcementsPage.sending') : t('announcementsPage.sendCta')}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1E293B] mb-3">{t('announcementsPage.historyTitle')}</h3>
          <MwasalatDataTable
            columns={COLUMNS}
            rows={sent}
            isLoading={isLoading}
            emptyLabel={t('announcementsPage.historyEmpty')}
            searchPlaceholder={t('announcementsPage.searchPlaceholder')}
            searchable={(n) => `${n.title} ${n.message}`}
          />
        </div>
      </div>
    </MwasalatAdminLayout>
  );
}
