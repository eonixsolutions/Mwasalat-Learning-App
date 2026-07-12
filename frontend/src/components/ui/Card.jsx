import { cn } from '../../utils/cn.js';

export default function Card({ children, className, padding = true, ...props }) {
  return (
    <div className={cn('card', padding && 'p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'primary', change }) {
  const colors = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', change: 'text-primary-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', change: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', change: 'text-orange-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', change: 'text-red-600' },
  };
  const c = colors[color] || colors.primary;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && <p className={cn('text-xs mt-1', c.change)}>{change}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', c.bg)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
      </div>
    </Card>
  );
}
