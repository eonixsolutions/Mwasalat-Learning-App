import { useTranslation } from 'react-i18next';
import MwasalatSupervisorLayout from '../../layouts/MwasalatSupervisorLayout.jsx';
import MwasalatAdminChatPanel from '../../components/mwasalat/MwasalatAdminChatPanel.jsx';

// Same Platform-Admin-hub escalation channel as MwasalatAdminChatPage (see
// counterpartRolesFor in mwasalatAdminChat.service.js) — supervisors only
// ever see Platform Admin as a counterpart, so no role badge or department
// context is needed; MwasalatAdminChatPanel already skips those for
// non-platform-admin viewers.
export default function MwasalatSupervisorAdminChatPage() {
  const { t } = useTranslation('mwasalatApp');

  return (
    <MwasalatSupervisorLayout title={t('adminChat.title')} subtitle={t('adminChat.subtitleSupervisor')}>
      <MwasalatAdminChatPanel />
    </MwasalatSupervisorLayout>
  );
}
