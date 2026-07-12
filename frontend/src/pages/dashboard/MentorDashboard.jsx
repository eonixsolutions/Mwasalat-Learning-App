import { Users, BookOpen, ClipboardList, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import Card, { StatCard } from '../../components/ui/Card.jsx';

export default function MentorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Mentor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Students" value="24" icon={Users} color="primary" />
        <StatCard title="Active Courses" value="3" icon={BookOpen} color="green" />
        <StatCard title="Pending Reviews" value="7" icon={ClipboardList} color="orange" />
        <StatCard title="Classes Today" value="2" icon={Calendar} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Today's Schedule</h3>
          <p className="text-gray-400 text-sm text-center py-8">No classes scheduled today.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Assignments to Review</h3>
          <p className="text-gray-400 text-sm text-center py-8">No pending reviews.</p>
        </Card>
      </div>
    </div>
  );
}
