import { useTranslation } from 'react-i18next';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatAdminChatPanel from '../../components/mwasalat/MwasalatAdminChatPanel.jsx';

// Same Platform-Admin-hub escalation channel as MwasalatAdminChatPage (see
// counterpartRolesFor in mwasalatAdminChat.service.js) — instructors only
// ever see Platform Admin as a counterpart, so no role badge or department
// context is needed; MwasalatAdminChatPanel already skips those for
// non-platform-admin viewers.
export default function MwasalatInstructorAdminChatPage() {
  const { t } = useTranslation('mwasalatApp');

  return (
    <MwasalatInstructorLayout title={t('adminChat.title')} subtitle={t('adminChat.subtitleInstructor')}>
      <MwasalatAdminChatPanel />
    </MwasalatInstructorLayout>
  );
}
