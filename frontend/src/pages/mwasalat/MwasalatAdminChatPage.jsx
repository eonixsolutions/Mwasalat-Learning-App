import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatAdminChatPanel from '../../components/mwasalat/MwasalatAdminChatPanel.jsx';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';

// Escalation channel with Platform Admin as the hub — Super Admin can't act
// day to day and Department Admin is scoped to one department, so this is how
// either flags something up (or Platform Admin follows up) without needing
// access they're deliberately walled off from. Instructors/Supervisors/IT
// Support reach the same channel via their own admin-chat pages; every page
// shares MwasalatAdminChatPanel and differs only in Layout + title/subtitle.
export default function MwasalatAdminChatPage() {
  const { t } = useTranslation('mwasalatApp');
  const { user } = useMwasalatAuthStore();
  const [searchParams] = useSearchParams();

  const subtitleKey = user?.role === 'department_admin'
    ? 'adminChat.subtitleDepartmentAdmin'
    : user?.role === 'platform_admin'
      ? 'adminChat.subtitlePlatformAdmin'
      : 'adminChat.subtitleSuperAdmin';

  return (
    <MwasalatAdminLayout title={t('adminChat.title')} subtitle={t(subtitleKey)}>
      <MwasalatAdminChatPanel initialCounterpartId={searchParams.get('with')} />
    </MwasalatAdminLayout>
  );
}
