import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, CalendarDays, ClipboardCheck, 
  MapPin, CreditCard, AlertTriangle, MessageSquare, Star, Settings, X, Plus, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/facility' },
  { name: 'Post a Shift', icon: PlusCircle, path: '/facility/post' },
  { name: 'Shifts', icon: CalendarDays, path: '/facility/shifts' },
  { name: 'Bookings', icon: ClipboardCheck, path: '/facility/bookings' },
  { name: 'Attendance', icon: MapPin, path: '/facility/attendance' },
  { name: 'Payments', icon: CreditCard, path: '/facility/payments' },
  { name: 'Disputes', icon: AlertTriangle, path: '/facility/disputes' },
  { name: 'Messages', icon: MessageSquare, path: '/facility/messages' },
  { name: 'Ratings & History', icon: Star, path: '/facility/ratings' },
  { name: 'Settings', icon: Settings, path: '/facility/settings' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const routerLocation = useLocation();
  const facilityName = user?.profile?.name || 'Facility';
  const initials = facilityName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plus className="text-white w-5 h-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">DocDuty</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facility Portal</p>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose()} // Close mobile menu on click
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${routerLocation.pathname === item.path ? 'text-primary' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user?.avatarUrl} name={facilityName} size="md" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">{facilityName}</span>
                <span className="text-xs text-slate-500">Facility Admin</span>
              </div>
              <button onClick={() => { logout(); }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
