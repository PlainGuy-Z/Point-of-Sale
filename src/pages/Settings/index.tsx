import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen p-8 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="mb-8">Manage your application preferences</p>

        {/* Theme Settings Card */}
        <div className={`rounded-xl p-6 mb-8 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Appearance</h2>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                {theme === 'dark' ? (
                  <Moon className="w-6 h-6 text-amber-400" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark mode
                </p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-amber-500' : 'bg-gray-300'
              }`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
              }`}></div>
            </button>
          </div>

          {/* Theme Preview */}
          <div className="mt-8">
            <h3 className="font-medium mb-4">Preview</h3>
            <div className={`grid grid-cols-2 gap-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {/* Light Mode Preview */}
              <div className={`rounded-lg p-4 border-2 ${
                theme === 'light' ? 'border-amber-500' : 'border-gray-300'
              } ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <Sun className="w-4 h-4" />
                </div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
                <p className="text-xs mt-3 text-center">Light Mode</p>
              </div>

              {/* Dark Mode Preview */}
              <div className={`rounded-lg p-4 border-2 ${
                theme === 'dark' ? 'border-amber-500' : 'border-gray-300'
              } ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <Moon className="w-4 h-4" />
                </div>
                <div className="h-2 bg-gray-600 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-2 bg-gray-600 dark:bg-gray-600 rounded w-4/5"></div>
                <p className="text-xs mt-3 text-center">Dark Mode</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className={`rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Current Settings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Active Theme</span>
              <span className={`px-3 py-1 rounded-full font-medium ${
                theme === 'dark' 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sidebar Background</span>
              <span className="font-medium">
                {theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Theme Saved</span>
              <span className="text-green-600 dark:text-green-400">
                ✓ In localStorage
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={`mt-8 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'
        }`}>
          <h3 className="font-semibold mb-2">💡 How it works:</h3>
          <ul className="text-sm space-y-1">
            <li>• Theme is saved automatically in your browser</li>
            <li>• Sidebar uses fixed colors: gray-200 (light) / gray-800 (dark)</li>
            <li>• Toggle affects all pages instantly</li>
            <li>• Check HTML element class to verify dark mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}