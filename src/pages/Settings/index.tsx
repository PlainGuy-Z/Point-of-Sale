import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Sun, 
  Moon, 
  Save, 
  Store, 
  ReceiptText, 
  MapPin, 
  Palette,
  CheckCircle2,
  Trash2,
  Database,
  Upload,
  Download,
  Shield,
  AlertTriangle,
  HardDrive,
  DollarSign,
  Hash,
  Percent,
  Type,
  Settings as SettingsIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BusinessSettings } from '../../types';

export default function Settings() {
  const { settings, updateSettings, createBackup, restoreBackup, getStorageInfo } = useApp();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Helper functions untuk type safety
  const parseCurrencyPosition = (value: string | null): 'before' | 'after' | 'before-space' | 'after-space' => {
    const validPositions = ['before', 'after', 'before-space', 'after-space'];
    return (validPositions.includes(value || '') ? value as any : 'before');
  };

  const parseThousandsSeparator = (value: string | null): 'comma' | 'dot' | 'space' | 'none' => {
    const validSeparators = ['comma', 'dot', 'space', 'none'];
    return (validSeparators.includes(value || '') ? value as any : 'comma');
  };

  const parseDecimalPlaces = (value: string | null): 0 | 2 => {
    const num = Number(value);
    return num === 2 ? 2 : 0;
  };

  // Handle save business profile dengan format mata uang
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSettings: BusinessSettings = {
      ...settings,
      storeName: (formData.get('storeName') as string) || settings.storeName,
      address: (formData.get('address') as string) || settings.address,
      taxRate: Number(formData.get('taxRate')) || settings.taxRate,
      currency: (formData.get('currency') as string) || settings.currency || 'IDR',
      currencyPosition: parseCurrencyPosition(formData.get('currencyPosition') as string),
      decimalPlaces: parseDecimalPlaces(formData.get('decimalPlaces') as string),
      thousandsSeparator: parseThousandsSeparator(formData.get('thousandsSeparator') as string),
      receiptFooter: (formData.get('receiptFooter') as string) || settings.receiptFooter
    };
    
    updateSettings(newSettings);
    
    // Show success message
    setRestoreMessage({
      type: 'success',
      text: 'Business profile updated successfully!'
    });
    
    setTimeout(() => setRestoreMessage(null), 3000);
  };

  // Handle backup creation
  const handleBackup = () => {
    const success = createBackup();
    if (success) {
      setRestoreMessage({
        type: 'success',
        text: 'Backup created successfully! File is downloading...'
      });
    } else {
      setRestoreMessage({
        type: 'error',
        text: 'Failed to create backup. Please try again.'
      });
    }
    setTimeout(() => setRestoreMessage(null), 3000);
  };

  // Handle restore from backup
  const handleRestore = async () => {
    if (!backupFile) {
      setRestoreMessage({
        type: 'error',
        text: 'Please select a backup file first'
      });
      setTimeout(() => setRestoreMessage(null), 3000);
      return;
    }

    if (!window.confirm(
      '⚠️ RESTORE BACKUP\n\n' +
      'This will replace ALL current data with backup data.\n\n' +
      'Current data will be lost forever.\n\n' +
      'Are you sure you want to continue?'
    )) {
      return;
    }

    setIsRestoring(true);
    setRestoreMessage(null);
    
    try {
      const result = await restoreBackup(backupFile);
      if (result.success) {
        setRestoreMessage({
          type: 'success',
          text: `Backup restored successfully!\n\nStats:\n• Products: ${result.stats?.products || 0}\n• Customers: ${result.stats?.customers || 0}\n• Transactions: ${result.stats?.transactions || 0}`
        });
        
        // Auto refresh after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setRestoreMessage({
          type: 'error',
          text: `Restore failed: ${result.message}`
        });
      }
    } catch (error) {
      setRestoreMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsRestoring(false);
      setBackupFile(null);
      setTimeout(() => setRestoreMessage(null), 5000);
    }
  };

  // Get storage info
  const storageInfo = getStorageInfo();

  // Helper untuk preview format mata uang
  const getCurrencyPreview = () => {
    const sampleAmount = 1234567.89;
    const symbols: Record<string, string> = {
      'IDR': 'Rp', 'USD': '$', 'EUR': '€', 'SGD': 'S$',
      'GBP': '£', 'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$',
      'CHF': 'CHF', 'CNY': '¥', 'KRW': '₩', 'MYR': 'RM',
      'THB': '฿', 'VND': '₫'
    };
    
    const safeCurrency = settings.currency || 'IDR';
    const safeDecimalPlaces = settings.decimalPlaces ?? 0;
    const safeThousandsSeparator = settings.thousandsSeparator || 'comma';
    const safeCurrencyPosition = settings.currencyPosition || 'before';
    
    let formatted = sampleAmount.toFixed(safeDecimalPlaces);
    
    // Apply thousands separator
    if (safeThousandsSeparator !== 'none') {
      const parts = formatted.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1] || '';
      
      let separator = ',';
      if (safeThousandsSeparator === 'dot') separator = '.';
      if (safeThousandsSeparator === 'space') separator = ' ';
      
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      formatted = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }
    
    const symbol = symbols[safeCurrency] || safeCurrency;
    
    switch (safeCurrencyPosition) {
      case 'before': return `${symbol}${formatted}`;
      case 'after': return `${formatted}${symbol}`;
      case 'before-space': return `${symbol} ${formatted}`;
      case 'after-space': return `${formatted} ${symbol}`;
      default: return `${symbol}${formatted}`;
    }
  };

  // Helper untuk format summary
  const formatCurrencyPositionSummary = (): string => {
    switch(settings.currencyPosition || 'before') {
      case 'before': return 'Before';
      case 'after': return 'After';
      case 'before-space': return 'Before (space)';
      case 'after-space': return 'After (space)';
      default: return 'Before';
    }
  };

  const formatThousandsSeparatorSummary = (): string => {
    switch(settings.thousandsSeparator || 'comma') {
      case 'comma': return 'Comma';
      case 'dot': return 'Dot';
      case 'space': return 'Space';
      case 'none': return 'None';
      default: return 'Comma';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Notification Message */}
      {restoreMessage && (
        <div className={`mb-6 p-4 rounded-xl border ${
          restoreMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {restoreMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                restoreMessage.type === 'success'
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {restoreMessage.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Application Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your business identity, tax rules, appearance preferences, and data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Business Identity Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Profile Card */}
          <form onSubmit={handleSaveSettings} className={`rounded-2xl border shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-700/50 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                <Store className="w-5 h-5 text-amber-500" />
                Business Profile
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your shop identity and tax configuration
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Shop Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shop Name
                </label>
                <input 
                  name="storeName" 
                  defaultValue={settings.storeName} 
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`} 
                  required
                  placeholder="Your Coffee Shop Name"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                  <textarea 
                    name="address" 
                    defaultValue={settings.address} 
                    rows={3}
                    className={`w-full px-4 py-3 pl-10 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Full address for receipts and documentation"
                  />
                </div>
              </div>

              {/* Tax Rate & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Rate (PPN)
                  </label>
                  <div className="relative">
                    <input 
                      name="taxRate" 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue={settings.taxRate} 
                      className={`w-full px-4 py-3 pr-12 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        isDark 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`} 
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency
                  </label>
                  <select 
                    name="currency"
                    defaultValue={settings.currency || 'IDR'}
                    className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                      isDark 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                  </select>
                </div>
              </div>

              {/* Currency Format Settings */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'
              }`}>
                <h3 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-900 dark:text-white">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  Currency Format
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Symbol Position */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Type className="w-3 h-3" />
                      Symbol Position
                    </label>
                    <select 
                      name="currencyPosition"
                      defaultValue={settings.currencyPosition || 'before'}
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="before">Before (Rp100,000)</option>
                      <option value="after">After (100,000Rp)</option>
                      <option value="before-space">Before with space (Rp 100,000)</option>
                      <option value="after-space">After with space (100,000 Rp)</option>
                    </select>
                  </div>
                  
                  {/* Decimal Places */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Hash className="w-3 h-3" />
                      Decimal Places
                    </label>
                    <select 
                      name="decimalPlaces"
                      defaultValue={settings.decimalPlaces ?? 0}
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="0">0 decimals (100,000)</option>
                      <option value="2">2 decimals (100,000.00)</option>
                    </select>
                  </div>
                  
                  {/* Thousands Separator */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Percent className="w-3 h-3" />
                      Thousands Separator
                    </label>
                    <select 
                      name="thousandsSeparator"
                      defaultValue={settings.thousandsSeparator || 'comma'}
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="comma">Comma (1,000,000)</option>
                      <option value="dot">Dot (1.000.000)</option>
                      <option value="space">Space (1 000 000)</option>
                      <option value="none">None (1000000)</option>
                    </select>
                  </div>
                </div>
                
                {/* Preview Section */}
                <div className="mt-4 pt-4 border-t border-gray-700/30 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <code className={`text-sm font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {getCurrencyPreview()}
                    </code>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sample: 1,234,567.89
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receipt Footer Message
                </label>
                <textarea 
                  name="receiptFooter" 
                  defaultValue={settings.receiptFooter || 'Thank you for your purchase!'} 
                  rows={2}
                  className={`w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Thank you for visiting! See you again soon."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700/50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
              <button 
                type="submit" 
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all active:scale-95"
              >
                <Save className="w-5 h-5" />
                Save Business Profile
              </button>
            </div>
          </form>

          {/* Data Management Card */}
          <div className={`rounded-2xl border shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-700/50 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                <Database className="w-5 h-5 text-blue-500" />
                Data Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Backup, restore, and manage your application data
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Storage Info */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Local Storage</span>
                  </div>
                  <span className="font-bold">
                    {storageInfo.used}KB / {storageInfo.total}KB
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      storageInfo.percent > 80 
                        ? 'bg-red-500' 
                        : storageInfo.percent > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageInfo.percent, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {storageInfo.percent}% of storage used
                </p>
              </div>

              {/* Backup & Restore Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className={`p-5 rounded-xl border transition-all hover:shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-700 hover:border-blue-500' 
                    : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-400'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Create Backup</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Export all data to JSON file
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBackup}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Backup
                  </button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Backup includes: Products, Customers, Transactions, Settings
                  </p>
                </div>

                {/* Restore Card */}
                <div className={`p-5 rounded-xl border ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Restore Backup</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Import data from backup file
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                    
                    <button
                      onClick={handleRestore}
                      disabled={!backupFile || isRestoring}
                      className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        backupFile && !isRestoring
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isRestoring ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Restore Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Factory Reset Warning */}
              <Link 
                to="/settings/data-reset"
                className={`block p-5 rounded-xl border transition-all hover:shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-800 hover:border-red-600' 
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-700 dark:text-red-300">
                        Factory Reset
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reset all data to factory settings
                      </p>
                    </div>
                  </div>
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                
                <div className="mt-4 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warning: This action will delete all transactions, custom products, and customer data. Cannot be undone.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Appearance & System */}
        <div className="space-y-8">
          {/* Theme Settings Card */}
          <div className={`rounded-2xl border shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-700/50 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                <Palette className="w-5 h-5 text-purple-500" />
                Appearance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize your interface appearance
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Theme Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${
                isDark ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                    {isDark ? (
                      <Moon className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Dark Mode</span>
                    <p className="text-sm text-gray-500">
                      {isDark ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isDark ? 'bg-purple-500' : 'bg-gray-400'
                  }`}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isDark ? 'translate-x-8' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>

              {/* Theme Previews */}
              <div>
                <h3 className="font-medium mb-3">Theme Preview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      !isDark 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-600 bg-gray-900'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                      <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
                      <div className="h-2 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
                    </div>
                    <p className={`text-xs font-bold text-center mt-3 ${
                      !isDark ? 'text-amber-700' : 'text-gray-400'
                    }`}>
                      LIGHT MODE
                    </p>
                  </div>

                  <div 
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      isDark 
                        ? 'border-purple-500 bg-gray-800' 
                        : 'border-gray-300 bg-gray-100'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                      <div className="h-2 w-3/4 bg-gray-600 dark:bg-gray-500 rounded" />
                      <div className="h-2 w-1/2 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>
                    <p className={`text-xs font-bold text-center mt-3 ${
                      isDark ? 'text-purple-400' : 'text-gray-500'
                    }`}>
                      DARK MODE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className={`rounded-2xl border shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-700/50 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                <Shield className="w-5 h-5 text-green-500" />
                System Information
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Application Version</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  v1.0.4
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Database</span>
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  LocalStorage
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Build Date</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Environment</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                  Production
                </span>
              </div>

              {/* Currency Settings Summary */}
              <div className="pt-4 border-t border-gray-700/30 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <SettingsIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency Settings
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Currency:</span>
                    <span className="font-medium">{settings.currency || 'IDR'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium">
                      {formatCurrencyPositionSummary()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Decimals:</span>
                    <span className="font-medium">{settings.decimalPlaces ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Separator:</span>
                    <span className="font-medium">
                      {formatThousandsSeparatorSummary()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}