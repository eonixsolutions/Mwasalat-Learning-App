import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatInstructorProfilePage() {
  return (
    <MwasalatInstructorLayout title="Profile" subtitle="Manage your account details">
      <MwasalatProfileCard />
    </MwasalatInstructorLayout>
  );
}
