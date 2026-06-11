import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Activity, Bell, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Simulator', path: '/simulator', icon: Activity },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1B2A4A] text-white flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Activity className="text-[#14A085]" />
          CashRadar
        </h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-[#0D7377] text-white font-semibold' 
                  : 'text-gray-300 hover:bg-[#1B2A4A]/80 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#CBD5E0]/20 text-sm text-gray-400">
        <p>V1.0 MVP</p>
      </div>
    </div>
  );
}
