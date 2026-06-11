import { Bell, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopNav() {
  return (
    <header className="h-16 bg-white border-b border-[#CBD5E0] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <div onClick={() => alert('Business Profile settings would open here.')} className="font-semibold text-[#1B2A4A] flex items-center gap-1 cursor-pointer hover:opacity-80">
          Mehta Auto Parts <ChevronDown size={16} />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="bg-[#EBF4F5] text-[#0D7377] px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
          Risk Score: <span className="text-lg">45</span>
        </div>
        
        <Link to="/alerts" className="relative p-2 text-[#4A5568] hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E53E3E] rounded-full border-2 border-white"></span>
        </Link>
        
        <div onClick={() => alert('User Settings would open here.')} className="w-8 h-8 bg-[#1B2A4A] rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90">
          RM
        </div>
      </div>
    </header>
  );
}
