import type { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomerStatsProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
  trend?: 'up' | 'down' | 'stable' | 'premium';
}

export default function CustomerStats({
  title,
  value,
  icon,
  description,
  trend = 'stable',
}: CustomerStatsProps) {
  const { theme } = useTheme();

  const trendColors = {
    up: theme === 'dark' ? 'text-green-400' : 'text-green-600',
    down: theme === 'dark' ? 'text-red-400' : 'text-red-600',
    stable: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
    premium: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
  };

  const trendBg = {
    up: theme === 'dark' ? 'bg-green-400/10' : 'bg-green-50',
    down: theme === 'dark' ? 'bg-red-400/10' : 'bg-red-50',
    stable: theme === 'dark' ? 'bg-blue-400/10' : 'bg-blue-50',
    premium: theme === 'dark' ? 'bg-purple-400/10' : 'bg-purple-50',
  };

  return (
    <div className={`
      rounded-xl shadow-sm border p-6 transition-all duration-150
      ${theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${trendBg[trend]} ${trendColors[trend]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </span>
        {trend !== 'stable' && (
          <span className={`text-sm font-medium ${trendColors[trend]}`}>
            {trend === 'up' && '↗ Increasing'}
            {trend === 'down' && '↘ Decreasing'}
            {trend === 'premium' && '⭐ Premium'}
          </span>
        )}
      </div>
    </div>
  );
}