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

  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          text: 'Positive',
          icon: <TrendingUp className="w-4 h-4" />,
          light: 'text-emerald-600 bg-emerald-50 icon-bg-emerald-100',
          dark: 'text-emerald-400 bg-emerald-900/30 icon-bg-emerald-900/50'
        };
      case 'down':
        return {
          text: 'Needs attention',
          icon: <TrendingDown className="w-4 h-4" />,
          light: 'text-red-600 bg-red-50 icon-bg-red-100',
          dark: 'text-red-400 bg-red-900/30 icon-bg-red-900/50'
        };
      case 'danger':
        return {
          text: 'High waste',
          icon: <TrendingDown className="w-4 h-4" />,
          light: 'text-red-600 bg-red-50 icon-bg-red-100',
          dark: 'text-red-400 bg-red-900/30 icon-bg-red-900/50'
        };
      case 'safe':
        return {
          text: 'Low waste',
          icon: <TrendingUp className="w-4 h-4" />,
          light: 'text-emerald-600 bg-emerald-50 icon-bg-emerald-100',
          dark: 'text-emerald-400 bg-emerald-900/30 icon-bg-emerald-900/50'
        };
      default:
        return {
          text: 'Stable',
          icon: <Minus className="w-4 h-4" />,
          light: 'text-gray-600 bg-gray-50 icon-bg-gray-100',
          dark: 'text-gray-400 bg-gray-700 icon-bg-gray-900'
        };
    }
  };

  const config = getTrendConfig();
  const currentStyle = isDark ? config.dark : config.light;

  // Memisahkan class untuk container ikon dan badge trend
  const styleParts = currentStyle.split(' ');
  const textColor = styleParts[0];
  const bgColor = styleParts[1];
  const iconBg = styleParts[2].replace('icon-bg-', '');

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
      isDark 
        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
        : 'bg-white border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-full ${iconBg} ${textColor}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {description}
        </p>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
          {config.icon}
          <span>{config.text}</span>
        </div>
      </div>
    </div>
  );
}