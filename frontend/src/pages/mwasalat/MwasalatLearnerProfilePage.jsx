import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatLearnerProfilePage() {
  return (
    <MwasalatLearnerLayout title="Profile" subtitle="Manage your account details">
      <MwasalatProfileCard />
    </MwasalatLearnerLayout>
  );
}
