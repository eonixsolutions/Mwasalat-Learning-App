import { useTranslation } from 'react-i18next';
import MwasalatItSupportLayout from '../../layouts/MwasalatItSupportLayout.jsx';
import MwasalatAdminChatPanel from '../../components/mwasalat/MwasalatAdminChatPanel.jsx';

// Same Platform-Admin-hub escalation channel as MwasalatAdminChatPage (see
// counterpartRolesFor in mwasalatAdminChat.service.js) — IT Support only
// ever sees Platform Admin as a counterpart, so no role badge or department
// context is needed; MwasalatAdminChatPanel already skips those for
// non-platform-admin viewers.
export default function MwasalatItSupportAdminChatPage() {
  const { t } = useTranslation('mwasalatApp');

  return (
    <MwasalatItSupportLayout title={t('adminChat.title')} subtitle={t('adminChat.subtitleItSupport')}>
      <MwasalatAdminChatPanel />
    </MwasalatItSupportLayout>
  );
}
