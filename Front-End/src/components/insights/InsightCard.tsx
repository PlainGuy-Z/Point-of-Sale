import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface InsightCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
  trend: 'up' | 'down' | 'danger' | 'safe' | 'neutral';
}

export default function InsightCard({
  title,
  value,
  icon,
  description,
  trend
}: InsightCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trendConfigs = {
    up: {
      text: 'Positive',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      iconBg: isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
    },
    down: {
      text: 'Attention',
      icon: <TrendingDown className="w-4 h-4" />,
      badge: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600',
      iconBg: isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600',
    },
    danger: {
      text: 'High waste',
      icon: <TrendingDown className="w-4 h-4" />,
      badge: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600',
      iconBg: isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600',
    },
    safe: {
      text: 'Low waste',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
      iconBg: isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
    },
    neutral: {
      text: 'Stable',
      icon: <Minus className="w-4 h-4" />,
      badge: isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600',
      iconBg: isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600',
    },
  };

  const config = trendConfigs[trend];

  return (
    <div className={`rounded-3xl border p-6 transition-all duration-200 ${
      isDark
        ? 'bg-stone-900/50 border-stone-800 hover:bg-stone-900'
        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${config.iconBg}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
          {description}
        </p>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.badge}`}>
          {config.icon}
          <span>{config.text}</span>
        </div>
      </div>
    </div>
  );
}