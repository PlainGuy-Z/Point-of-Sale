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
  CheckCircle2
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // --- FORM HANDLER UNTUK BUSINESS PROFILE ---
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateSettings({
      storeName: formData.get('storeName') as string,
      address: formData.get('address') as string,
      taxRate: Number(formData.get('taxRate')),
    });
    
    alert('Business profile updated successfully!');
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Settings</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Manage your business identity, tax rules, and appearance preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Business Identity Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveSettings} className={`p-6 md:p-8 rounded-3xl border shadow-xl ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-8">
                {/* Shop Identity */}
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 font-black text-amber-500 uppercase tracking-widest text-xs">
                    <Store size={18}/> Shop Identity
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Coffee Shop Name</label>
                      <input 
                        name="storeName" 
                        defaultValue={settings.storeName} 
                        className={`w-full p-3 rounded-xl border outline-none focus:border-amber-500 transition-all ${
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        }`} 
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Full Address (for Receipt)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-500" size={18} />
                        <textarea 
                          name="address" 
                          defaultValue={settings.address} 
                          rows={2}
                          className={`w-full p-3 pl-10 rounded-xl border outline-none focus:border-amber-500 transition-all ${
                            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tax & Service Rule */}
                <section className="space-y-4 pt-6 border-t border-gray-700/50">
                  <h2 className="flex items-center gap-2 font-black text-amber-500 uppercase tracking-widest text-xs">
                    <ReceiptText size={18}/> Tax & Service Rules
                  </h2>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Government Tax (PPN)</label>
                    <div className="relative w-full sm:w-1/2">
                      <input 
                        name="taxRate" 
                        type="number" 
                        defaultValue={settings.taxRate} 
                        className={`w-full p-3 rounded-xl border outline-none focus:border-amber-500 transition-all ${
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        }`} 
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">%</span>
                    </div>
                  </div>
                </section>

                <button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 uppercase tracking-tight"
                >
                  <Save size={20}/> Save Business Profile
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Appearance & System Info */}
          <div className="space-y-6">
            
            {/* Theme Settings Card */}
            <div className={`p-6 rounded-3xl border shadow-lg ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className="flex items-center gap-2 font-black text-amber-500 uppercase tracking-widest text-xs mb-6">
                <Palette size={18}/> Appearance
              </h2>
              
              <div className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                isDark ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                    {isDark ? <Moon className="text-amber-400" size={20} /> : <Sun className="text-amber-600" size={20} />}
                  </div>
                  <span className="font-bold text-sm">Dark Mode</span>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isDark ? 'bg-amber-500' : 'bg-gray-400'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>

              {/* Theme Previews */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div 
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${!isDark ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-gray-900'}`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                  <div className="h-1.5 w-full bg-gray-300 rounded mb-1" />
                  <div className="h-1.5 w-2/3 bg-gray-300 rounded" />
                  <p className="text-[10px] mt-2 font-bold text-center">LIGHT</p>
                </div>

                <div 
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${isDark ? 'border-amber-500 bg-gray-700' : 'border-transparent bg-gray-100'}`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                  <div className="h-1.5 w-full bg-gray-600 rounded mb-1" />
                  <div className="h-1.5 w-2/3 bg-gray-600 rounded" />
                  <p className="text-[10px] mt-2 font-bold text-center">DARK</p>
                </div>
              </div>
            </div>

            {/* System Info Card */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Database</span>
                  <span className="flex items-center gap-1 text-green-500 font-bold">
                    <CheckCircle2 size={14} /> LocalStorage
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Version</span>
                  <span className="font-mono font-bold">v1.0.4-stable</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}