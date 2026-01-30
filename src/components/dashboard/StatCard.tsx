import type { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  gradient?: string;
  delay?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  subtitle,
  gradient = 'from-blue-500 to-cyan-500',
  delay = '0'
}: StatCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trendConfig = {
    up: { 
      icon: <TrendingUp className="w-3 h-3" />, 
      color: isDark ? 'text-green-400' : 'text-green-600',
      bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      border: isDark ? 'border-green-800' : 'border-green-200'
    },
    down: { 
      icon: <TrendingDown className="w-3 h-3" />, 
      color: isDark ? 'text-red-400' : 'text-red-600',
      bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      border: isDark ? 'border-red-800' : 'border-red-200'
    },
    stable: { 
      icon: <Minus className="w-3 h-3" />, 
      color: isDark ? 'text-gray-400' : 'text-gray-600',
      bg: isDark ? 'bg-gray-700' : 'bg-gray-100',
      border: isDark ? 'border-gray-600' : 'border-gray-200'
    }
  };

  const trendStyle = trendConfig[trend];

  return (
    <div 
      className={`
        rounded-2xl border p-5 transition-all duration-300 
        hover:scale-[1.02] hover:shadow-lg group cursor-pointer
        animate-in fade-in slide-in-from-bottom-4
        ${isDark 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-white border-gray-100 shadow-sm'
        }
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon dengan gradient */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            {icon}
          </div>
        </div>
        
        {/* Trend indicator */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${trendStyle.bg} ${trendStyle.border} ${trendStyle.color}`}>
          {trendStyle.icon}
          {trendValue && <span>{trendValue}</span>}
        </div>
      </div>

      {/* Value dengan animasi */}
      <div className="mb-2">
        <p className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>

      {/* Title dan subtitle */}
      <div className="space-y-1">
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom gradient bar */}
      <div className={`mt-4 h-1 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 group-hover:w-full`}
          style={{ 
            width: trend === 'up' ? '85%' : trend === 'down' ? '40%' : '65%',
            transition: 'width 1s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}