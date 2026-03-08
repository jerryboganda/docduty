import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, Home, Search, CalendarDays, 
  MapPin, Wallet, AlertTriangle, MessageSquare, User, Settings, X, Plus, Stethoscope, LogOut, BellRing
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import UserAvatar from '../UserAvatar';
import { subscribeToChannel, unsubscribeFromChannel } from '../../lib/realtime';

const navItems = [
  { name: 'Home (Offers)', icon: Home, path: '/doctor' },
  { name: 'Search Shifts', icon: Search, path: '/doctor/search' },
  { name: 'My Bookings', icon: CalendarDays, path: '/doctor/bookings' },
  { name: 'Attendance', icon: MapPin, path: '/doctor/attendance' },
  { name: 'Wallet & Payouts', icon: Wallet, path: '/doctor/wallet' },
  { name: 'Disputes', icon: AlertTriangle, path: '/doctor/disputes' },
  { name: 'Messages', icon: MessageSquare, path: '/doctor/messages' },
  { name: 'Profile & Verification', icon: User, path: '/doctor/profile' },
  { name: 'Settings', icon: Settings, path: '/doctor/settings' },
];

export default function DoctorLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const doctorName = user?.profile?.fullName || 'Doctor';

  const pageTitles: Record<string, string> = {
    '/doctor': 'Shift Offers',
    '/doctor/bookings': 'My Bookings',
    '/doctor/attendance': 'Attendance',
    '/doctor/wallet': 'Wallet & Payouts',
    '/doctor/disputes': 'Disputes',
    '/doctor/messages': 'Messages',
    '/doctor/profile': 'Profile',
    '/doctor/settings': 'Settings',
  };
  const pageTitle = pageTitles[location.pathname] || 'Doctor Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Poll for unread notifications + real-time subscription
  useEffect(() => {
    const fetchUnread = () => {
      api.get<any>('/notifications?unreadOnly=true&limit=1').then(data => {
        setUnreadCount(data?.total || 0);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const channelName = user?.id ? `private-user.${user.id}` : null;
    if (channelName) {
      const channel = subscribeToChannel(channelName);
      if (channel) {
        channel.bind('new-notification', () => setUnreadCount(prev => prev + 1));
      }
    }

    return () => {
      clearInterval(interval);
      if (channelName) unsubscribeFromChannel(channelName);
    };
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-background-light font-display antialiased overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">DocDuty</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor Portal</p>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/doctor'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${window.location.pathname === item.path || (item.path === '/doctor' && window.location.pathname === '/doctor') ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user?.avatarUrl} name={doctorName} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{doctorName}</span>
                <span className="text-xs text-emerald-600 font-medium">Verified Doctor</span>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/doctor/notifications')} className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <Bell className="w-6 h-6" />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <button onClick={() => navigate('/doctor/profile')} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              <UserAvatar avatarUrl={user?.avatarUrl} name={doctorName} size="sm" />
              <span className="hidden sm:block">{doctorName}</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4 px-4 sm:px-5 lg:px-6 max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
