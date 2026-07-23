import { useTranslation } from 'react-i18next';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatInstructorProfilePage() {
  const { t } = useTranslation('mwasalatApp');
  return (
    <MwasalatInstructorLayout title={t('instructorProfile.title')} subtitle={t('instructorProfile.subtitle')}>
      <MwasalatProfileCard />
    </MwasalatInstructorLayout>
  );
}
