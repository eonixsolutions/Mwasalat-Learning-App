import { useTranslation } from 'react-i18next';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatLearnerProfilePage() {
  const { t } = useTranslation('mwasalatApp');
  return (
    <MwasalatLearnerLayout title={t('learner.profileTitle')} subtitle={t('learner.profileSubtitle')}>
      <MwasalatProfileCard />
    </MwasalatLearnerLayout>
  );
}
