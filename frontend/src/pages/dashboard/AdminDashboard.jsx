import { Users, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value="128" icon={GraduationCap} color="primary" />
        <StatCard title="Active Mentors" value="12" icon={Users} color="green" />
        <StatCard
          title="New Applications"
          value="8"
          icon={ClipboardList}
          color="orange"
          change="Pending review"
        />
        <StatCard
          title="Fee Collection"
          value="₹2.4L"
          icon={CreditCard}
          color="primary"
          change="This month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {[
              { name: 'Arjun Kumar', course: 'Full Stack Dev', status: 'pending' },
              { name: 'Priya Sharma', course: 'Data Science', status: 'under_review' },
              { name: 'Rahul Singh', course: 'Full Stack Dev', status: 'approved' },
            ].map((app) => (
              <div key={app.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-500">{app.course}</p>
                </div>
                <Badge variant={app.status === 'approved' ? 'success' : app.status === 'under_review' ? 'warning' : 'default'}>
                  {app.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Fee Alerts</h3>
          <p className="text-gray-400 text-sm text-center py-8">
            No overdue fees at the moment.
          </p>
        </Card>
      </div>
    </div>
  );
}
