import { useTranslation } from 'react-i18next';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatAdminProfilePage() {
  const { t } = useTranslation('mwasalatApp');
  return (
    <MwasalatAdminLayout title={t('adminProfile.title')} subtitle={t('adminProfile.subtitle')}>
      <MwasalatProfileCard />
    </MwasalatAdminLayout>
  );
}
