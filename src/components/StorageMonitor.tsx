import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AlertTriangle, Trash2, Database, Download } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function StorageMonitor() {
  const { getStorageInfo, clearOldData, createBackup } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 10240, percent: 0 });
  const [showWarning, setShowWarning] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const checkStorage = () => {
      const info = getStorageInfo();
      setStorageInfo(info);
      setShowWarning(info.percent > 70);
    };

    checkStorage();
    const interval = setInterval(checkStorage, 30000); // Cek setiap 30 detik
    return () => clearInterval(interval);
  }, [getStorageInfo]);

  const handleBackup = () => {
    createBackup();
    setBackupStatus('Backup berhasil dibuat!');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  const handleClearData = () => {
    if (confirm('Yakin ingin membersihkan data lama dan gambar? Tindakan ini tidak dapat dibatalkan.')) {
      clearOldData();
    }
  };

  if (!showWarning) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300 ${isMinimized ? 'w-auto' : 'max-w-sm'}`}>
      <div className={`rounded-xl shadow-xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Storage {storageInfo.percent > 90 ? '⚠️' : 'ℹ️'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {isMinimized ? '📈' : '📉'}
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Content */}
            <div className="p-4">
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {storageInfo.percent > 90 
                  ? 'Penyimpanan hampir penuh! Backup data dan bersihkan segera.'
                  : storageInfo.percent > 80
                  ? 'Penyimpanan mulai penuh. Disarankan backup data.'
                  : 'Penyimpanan sedang tinggi.'}
              </p>
              
              {/* Progress Bar */}
              <div className={`w-full rounded-full h-2.5 mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    storageInfo.percent > 90 
                      ? 'bg-red-500' 
                      : storageInfo.percent > 80
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(storageInfo.percent, 100)}%` }}
                />
              </div>
              
              {/* Storage Info */}
              <div className="flex justify-between text-xs mb-4">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {storageInfo.used}KB / {storageInfo.total}KB
                </span>
                <span className={`font-bold ${
                  storageInfo.percent > 90 ? 'text-red-500' :
                  storageInfo.percent > 80 ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  {storageInfo.percent}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleBackup}
                  className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Download size={16} />
                  Buat Backup
                </button>
                
                <button
                  onClick={handleClearData}
                  className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <Trash2 size={16} />
                  Bersihkan Data Lama
                </button>
              </div>

              {backupStatus && (
                <div className={`mt-3 text-sm text-center py-1.5 rounded ${
                  isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
                }`}>
                  {backupStatus}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 text-xs ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              💡 Backup data secara berkala untuk menghindari kehilangan data.
            </div>
          </>
        )}
      </div>
    </div>
  );
}