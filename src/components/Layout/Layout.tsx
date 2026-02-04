import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { Home, ChevronRight } from 'lucide-react';

export default function Layout() {
  const { theme } = useTheme();
  const location = useLocation();

  // Fungsi untuk mendapatkan breadcrumb dari path
  const getBreadcrumbs = () => {
    if (location.pathname === '/') return [];
    
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];
    
    let accumulatedPath = '';
    for (let i = 0; i < pathnames.length; i++) {
      accumulatedPath += `/${pathnames[i]}`;
      const name = pathnames[i].replace(/-/g, ' ');
      
      breadcrumbs.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        path: accumulatedPath,
        isLast: i === pathnames.length - 1
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isDashboard = location.pathname === '/';

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar />
      
      <main className="ml-64 flex-1 overflow-hidden relative">
        {/* Header dengan Breadcrumb */}
        {!isDashboard && (
          <div className={`sticky top-0 z-10 px-8 py-4 border-b backdrop-blur-sm ${
            theme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          }`}>
            <div className="flex items-center">
              <Link 
                to="/" 
                className={`inline-flex items-center gap-2 text-sm ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home size={16} />
                Dashboard
              </Link>
              
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight 
                    size={16} 
                    className={`mx-2 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`} 
                  />
                  {crumb.isLast ? (
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {crumb.name}
                    </span>
                  ) : (
                    <Link 
                      to={crumb.path}
                      className={`hover:underline ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            
            {/* Page Title */}
            <h1 className={`text-2xl font-bold mt-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Dashboard'}
            </h1>
          </div>
        )}
        
        {/* Main Content */}
        <div className={`p-8 ${isDashboard ? 'pt-8' : 'pt-6'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}