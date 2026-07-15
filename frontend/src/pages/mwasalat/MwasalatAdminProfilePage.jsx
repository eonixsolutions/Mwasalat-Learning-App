import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatProfileCard from '../../components/mwasalat/MwasalatProfileCard.jsx';

export default function MwasalatAdminProfilePage() {
  return (
    <MwasalatAdminLayout title="Profile" subtitle="Manage your account details">
      <MwasalatProfileCard />
    </MwasalatAdminLayout>
  );
}
