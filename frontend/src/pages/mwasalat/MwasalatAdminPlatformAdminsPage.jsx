import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Loader2, X, Pencil, Ban, CheckCircle2, UserCog, Send, MessageCircle } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatUserService } from '../../services/mwasalatUser.service.js';
import MwasalatBlockUserModal from '../../components/mwasalat/MwasalatBlockUserModal.jsx';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm bg-white text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 hover:border-mwasalatInk-300 transition-colors';

const statusOf = (u) => (!u.passwordSet ? 'invited' : u.isActive ? 'active' : 'blocked');

function InvitePlatformAdminModal({ onClose, onInvited }) {
  const { t } = useTranslation('mwasalatApp');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await mwasalatUserService.invitePlatformAdmin(data);
      toast.success(t('platformAdminsPage.inviteModal.sentToast'));
      onInvited();
    } catch (err) {
      toast.error(err.response?.data?.message || t('platformAdminsPage.inviteModal.sendFailed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('platformAdminsPage.inviteModal.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#475569] mb-5">
          {t('platformAdminsPage.inviteModal.body')}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.name')}</label>
            <input className={inputClass} {...register('name', { required: t('auth.errors.nameRequired') })} />
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.email')}</label>
            <input type="email" dir="ltr" className={`${inputClass} text-start`} placeholder={t('platformAdminsPage.inviteModal.emailPlaceholder')} {...register('email', { required: t('auth.errors.emailRequired') })} />
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t('platformAdminsPage.inviteModal.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditPlatformAdminModal({ admin, onClose, onSaved }) {
  const { t } = useTranslation('mwasalatApp');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: admin.name, email: admin.email },
  });
  const emailChanged = watch('email')?.trim().toLowerCase() !== admin.email.toLowerCase();

  const onSubmit = async (data) => {
    try {
      const updated = await mwasalatUserService.updatePlatformAdmin(admin._id, data);
      toast.success(updated.passwordSet === false ? t('platformAdminsPage.editModal.emailChangedToast') : t('platformAdminsPage.editModal.savedToast'));
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || t('platformAdminsPage.editModal.saveFailed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#1E293B]">{t('platformAdminsPage.editModal.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#475569] mb-5">
          {t('platformAdminsPage.editModal.body')}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.name')}</label>
            <input className={inputClass} {...register('name', { required: t('auth.errors.nameRequired') })} />
            {errors.name && <p className="text-xs text-[#C22033] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('common.email')}</label>
            <input type="email" dir="ltr" className={`${inputClass} text-start`} {...register('email', { required: t('auth.errors.emailRequired') })} />
            {errors.email && <p className="text-xs text-[#C22033] mt-1">{errors.email.message}</p>}
            {emailChanged && !errors.email && (
              <p className="text-xs text-mwasalatInk-500 mt-1.5">{t('platformAdminsPage.editModal.emailChangeWarning')}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {t('platformAdminsPage.editModal.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

// Super Admin's operational lever — provisioning, editing, and blocking the
// single Platform Admin account it delegates day-to-day platform control to.
// Only one such account can ever exist (enforced server-side), so this is a
// single-record profile view rather than a list.
export default function MwasalatAdminPlatformAdminsPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    mwasalatUserService.listByRole('platform_admin')
      .then(setAdmins)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const admin = admins[0] ?? null;
  const status = admin ? statusOf(admin) : null;
  const dateLocale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-GB';

  const handleToggle = async (reason) => {
    setPendingId(admin._id);
    try {
      await mwasalatUserService.setActive(admin._id, !admin.isActive, reason);
      toast.success(admin.isActive ? t('platformAdminsPage.blockedToast') : t('platformAdminsPage.unblockedToast'));
      setBlockTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('platformAdminsPage.updateFailed'));
    } finally {
      setPendingId(null);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await mwasalatUserService.invitePlatformAdmin({ name: admin.name, email: admin.email });
      toast.success(t('platformAdminsPage.resendToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('platformAdminsPage.updateFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <MwasalatAdminLayout title={t('platformAdminsPage.title')} subtitle={t('platformAdminsPage.subtitle')}>
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="card p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('dataTable.loading')}
          </div>
        ) : !admin ? (
          <div className="card p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mx-auto mb-4">
              <UserCog className="w-6 h-6 text-mwasalatInk-500" />
            </div>
            <p className="text-sm text-[#475569] mb-5">{t('platformAdminsPage.emptyNoAdmins')}</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Mail className="w-4 h-4" /> {t('platformAdminsPage.addButton')}
            </button>
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                  {admin.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-[#1E293B]">{admin.name}</p>
                  <p className="text-sm text-[#475569]" dir="ltr">{admin.email}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                status === 'blocked' ? 'bg-[#FBE7E9] text-mwasalatRed-600' : 'bg-mwasalatInk-100 text-mwasalatInk-500'
              }`}>
                {status === 'invited' ? t('userTable.invited') : status === 'blocked' ? t('userTable.blocked') : t('userTable.active')}
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] mt-4">
              {t('userTable.joined')}: <span dir="ltr">{new Date(admin.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>

            <div className="flex flex-wrap gap-2.5 mt-5 pt-5 border-t border-[#F1F5F9]">
              {status === 'invited' && (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 bg-mwasalatInk-100 hover:bg-mwasalatInk-200 disabled:opacity-50 text-mwasalatInk-500 font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
                >
                  {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {t('platformAdminsPage.resendButton')}
                </button>
              )}
              <button
                onClick={() => navigate(`/admin/chat?with=${admin._id}`)}
                className="inline-flex items-center gap-1.5 bg-[#F1F5F9] hover:bg-mwasalatInk-100 text-[#475569] font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" /> {t('platformAdminsPage.messageButton')}
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#F1F5F9] hover:bg-mwasalatInk-100 text-[#475569] font-semibold px-3.5 py-2 rounded-xl transition-colors text-xs"
              >
                <Pencil className="w-3.5 h-3.5" /> {t('platformAdminsPage.editButton')}
              </button>
              {status !== 'invited' && (
                <button
                  onClick={() => (admin.isActive ? setBlockTarget(admin) : handleToggle())}
                  disabled={pendingId === admin._id}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                    admin.isActive
                      ? 'bg-[#FBE7E9] text-mwasalatRed-600 hover:bg-mwasalatRed-100'
                      : 'bg-mwasalatInk-100 text-mwasalatInk-500 hover:bg-mwasalatInk-200'
                  }`}
                >
                  {pendingId === admin._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : admin.isActive ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {admin.isActive ? t('userTable.block') : t('userTable.unblock')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <InvitePlatformAdminModal
          onClose={() => setShowInviteModal(false)}
          onInvited={() => { setShowInviteModal(false); load(); }}
        />
      )}
      {showEditModal && admin && (
        <EditPlatformAdminModal
          admin={admin}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); load(); }}
        />
      )}
      {blockTarget && (
        <MwasalatBlockUserModal
          user={blockTarget}
          isSubmitting={pendingId === blockTarget._id}
          onConfirm={handleToggle}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </MwasalatAdminLayout>
  );
}
