import { IconType } from 'react-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  iconColor?: string;
  valueColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-500',
  valueColor = 'text-gray-900 dark:text-white',
  trend 
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className={`text-3xl font-bold ${valueColor}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <Icon className={`text-3xl ${iconColor}`} />
      </div>
    </div>
  );
}
