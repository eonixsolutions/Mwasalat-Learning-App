import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatNotificationService } from '../../services/mwasalatNotification.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';
import { MWASALAT_HIDE_SUPERVISOR_ROLE } from '../../constants/mwasalatRoles.js';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

export default function MwasalatAdminAnnouncementsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const canManage = user?.role === 'platform_admin';
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

  // Every distinct role gets its own toggle so admins can target any combination
  // (e.g. instructors + supervisors for a grading-policy notice). 'external_learner'
  // is kept separate from 'learner' here — unlike most other features, which lump
  // them together via MWASALAT_LEARNER_ROLES — because staff explicitly asked to
  // reach internal vs. external/contractor learners independently.
  const AUDIENCE_OPTIONS = [
    { key: 'learner', roles: ['learner'] },
    { key: 'externalLearner', roles: ['external_learner'] },
    { key: 'instructor', roles: ['instructor'] },
    ...(MWASALAT_HIDE_SUPERVISOR_ROLE ? [] : [{ key: 'supervisor', roles: ['supervisor'] }]),
    { key: 'departmentAdmin', roles: ['department_admin'] },
    { key: 'itSupport', roles: ['it_support'] },
  ];

  const ROLE_LABEL_KEYS = {
    learner: 'learner',
    external_learner: 'externalLearner',
    instructor: 'instructor',
    supervisor: 'supervisor',
    department_admin: 'departmentAdmin',
    it_support: 'itSupport',
  };

  // 'all' is a shortcut for "no role filter" (roles: []), mutually exclusive with
  // picking specific audiences — selecting it clears any individual picks and vice versa.
  const [selectedKeys, setSelectedKeys] = useState(['all']);

  const toggleAudience = (key) => {
    setSelectedKeys((prev) => {
      if (key === 'all') return ['all'];
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev.filter((k) => k !== 'all'), key];
      return next.length ? next : ['all'];
    });
  };

  const audienceLabel = (roles) => {
    if (!roles?.length) return t('announcementsPage.audience.all');
    return [...new Set(roles)]
      .map((r) => (ROLE_LABEL_KEYS[r] ? t(`announcementsPage.audience.${ROLE_LABEL_KEYS[r]}`) : r))
      .join(', ');
  };

  const onSubmit = async (data) => {
    setIsSending(true);
    try {
      const roles = selectedKeys.includes('all')
        ? []
        : [...new Set(selectedKeys.flatMap((key) => AUDIENCE_OPTIONS.find((o) => o.key === key)?.roles ?? []))];
      await mwasalatNotificationService.send({
        title: data.title.trim(),
        message: data.message.trim(),
        roles,
      });
      toast.success(t('announcementsPage.sentToast'));
      reset();
      setSelectedKeys(['all']);
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
      key: 'roles',
      label: t('announcementsPage.columns.audience'),
      render: (n) => <span className="text-[#475569]">{audienceLabel(n.roles)}</span>,
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
        {canManage && (
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
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('announcementsPage.audienceLabel')}</label>
                <p className="text-xs text-[#94A3B8] mb-2">{t('announcementsPage.audienceHint')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAudience('all')}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      selectedKeys.includes('all')
                        ? 'border-mwasalatInk-500 bg-mwasalatInk-500 text-white'
                        : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
                    }`}
                  >
                    {t('announcementsPage.audience.all')}
                  </button>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleAudience(opt.key)}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        selectedKeys.includes(opt.key)
                          ? 'border-mwasalatInk-500 bg-mwasalatInk-100 text-mwasalatInk-500'
                          : 'border-[#E2E8F0] text-[#475569] hover:border-mwasalatInk-300'
                      }`}
                    >
                      {t(`announcementsPage.audience.${opt.key}`)}
                    </button>
                  ))}
                </div>
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
        )}

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
