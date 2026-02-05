import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext'; // Tambah ini
import { 
  Trash2, 
  AlertTriangle, 
  Database, 
  ArrowLeft,
  HardDrive,
  Package,
  Users,
  Receipt,
  AlertCircle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function DataResetPage() {
  const { resetAllData, products, transactions, customers, wasteLogs } = useApp();
    const { theme } = useTheme(); 
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Stats untuk ditampilkan
  const stats = [
    {
      icon: Package,
      label: 'Products',
      value: products.length,
      color: 'blue'
    },
    {
      icon: Receipt,
      label: 'Transactions',
      value: transactions.length,
      color: 'green'
    },
    {
      icon: Users,
      label: 'Customers',
      value: customers.length,
      color: 'purple'
    },
    {
      icon: Database,
      label: 'Waste Logs',
      value: wasteLogs.length,
      color: 'yellow'
    }
  ];

  const handleResetAll = async () => {
    const confirmed = window.confirm(
      '⚠️ FACTORY DATA RESET\n\n' +
      'You are about to reset ALL data to factory settings.\n\n' +
      'This will delete:\n' +
      `• ${products.length} products (except default ones)\n` +
      `• ${transactions.length} transactions\n` +
      `• ${customers.length} customers (except default ones)\n` +
      `• ${wasteLogs.length} waste logs\n\n` +
      'Only your settings (shop name, tax rate, etc.) will be preserved.\n\n' +
      'THIS ACTION IS PERMANENT AND CANNOT BE UNDONE!\n\n' +
      'Are you absolutely sure you want to continue?'
    );
    
    if (confirmed) {
      setIsResetting(true);
      
      try {
        const success = await resetAllData();
        
        if (success) {
          setResetSuccess(true);
          
          // Auto redirect setelah 5 detik
          setTimeout(() => {
            navigate('/');
          }, 5000);
        } else {
          alert('Reset was cancelled or failed.');
        }
      } catch (error) {
        alert(`Error during reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsResetting(false);
      }
    }
  };
  
  // Jika reset berhasil, tampilkan success screen
  if (resetSuccess) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Reset Successful!
        </h1>
        
        <div className={`p-6 rounded-2xl mb-6 ${
          isDark ? 'bg-gray-800' : 'bg-green-50'
        }`}>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            All data has been reset to factory settings. Your business settings have been preserved.
          </p>
          
          <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
            <RotateCcw className="w-4 h-4 animate-spin" />
            Redirecting to dashboard in 5 seconds...
          </div>
        </div>
        
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all"
        >
          Go to Dashboard Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-8">
        <Link 
          to="/settings"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6">
          <Database className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Factory Data Reset
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Reset all application data to original factory state. Only your business settings will be preserved.
        </p>
      </div>

      {/* Current Data Summary */}
      <div className={`p-6 rounded-2xl mb-10 ${
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mb-6">
          <HardDrive className="w-6 h-6 text-blue-500" />
          Current Data Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border ${
                isDark 
                  ? `bg-gradient-to-br from-${stat.color}-900/20 to-${stat.color}-800/20 border-${stat.color}-800`
                  : `bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 border-${stat.color}-200`
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  isDark ? `bg-${stat.color}-900/30` : `bg-${stat.color}-100`
                }`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is the data that will be deleted during reset.
        </p>
      </div>

      {/* Warning Section */}
      <div className={`p-8 rounded-2xl border mb-10 ${
        isDark 
          ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-800' 
          : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
      }`}>
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">
              ⚠️ EXTREME CAUTION REQUIRED
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400">Irreversible Action</h4>
                  <p className="text-red-600 dark:text-red-400/90">
                    Once reset, all your data will be permanently deleted and cannot be recovered.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400">What Will Be Preserved</h4>
                  <p className="text-red-600 dark:text-red-400/90">
                    Only your business settings (shop name, address, tax rate, etc.) will be kept.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400">Backup Recommendation</h4>
                  <p className="text-red-600 dark:text-red-400/90">
                    Always create a backup before proceeding. You can do this from the main Settings page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-6">
        <button
          onClick={handleResetAll}
          disabled={isResetting}
          className={`w-full py-5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xl rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-lg hover:shadow-xl active:scale-[0.98] ${
            isResetting ? 'cursor-wait' : ''
          }`}
        >
          {isResetting ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              RESETTING DATA...
            </>
          ) : (
            <>
              <Trash2 className="w-6 h-6" />
              RESET ALL DATA TO FACTORY SETTINGS
            </>
          )}
        </button>
        
        <Link 
          to="/settings"
          className={`block w-full py-4 text-center font-medium rounded-xl border transition-all ${
            isDark 
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white' 
              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
          }`}
        >
          Cancel and Return to Settings
        </Link>
      </div>

      {/* Backup Reminder */}
      <div className={`mt-10 p-6 rounded-2xl border ${
        isDark 
          ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800' 
          : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">
              Create Backup First
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-400/90">
              Before resetting, consider creating a backup of your current data from the{' '}
              <Link 
                to="/settings" 
                className="font-bold underline hover:no-underline"
              >
                main Settings page
              </Link>
              . This allows you to restore your data if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}