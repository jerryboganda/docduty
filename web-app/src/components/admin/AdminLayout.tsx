import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, LayoutDashboard, UserCheck, Users, 
  Building2, AlertTriangle, FileSignature, DollarSign, 
  ClipboardList, BarChart3, Settings, X, ShieldAlert, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import UserAvatar from '../UserAvatar';
import { subscribeToChannel, unsubscribeFromChannel } from '../../lib/realtime';

const navItems = [
  { name: 'Ops Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Verification Queue', icon: UserCheck, path: '/admin/verifications' },
  { name: 'Users', icon: Users, path: '/admin/users' },
  { name: 'Facilities & Locations', icon: Building2, path: '/admin/facilities' },
  { name: 'Disputes Center', icon: AlertTriangle, path: '/admin/disputes' },
  { name: 'Policies & Fees', icon: FileSignature, path: '/admin/policies' },
  { name: 'Payments Oversight', icon: DollarSign, path: '/admin/payments' },
  { name: 'Audit Logs', icon: ClipboardList, path: '/admin/audit' },
  { name: 'Analytics & Exports', icon: BarChart3, path: '/admin/analytics' },
  { name: 'Admin Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentNav = navItems.find(item => 
    item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNav?.name || 'Ops Portal';

  const handleLogout = async () => {
    await logout();
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
    <div className="flex h-screen bg-slate-50 font-display antialiased overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="text-white w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">DocDuty Ops</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto py-4">
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${window.location.pathname === item.path || (item.path === '/admin' && window.location.pathname === '/admin') ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user?.avatarUrl} name={user?.profile?.full_name || 'Admin User'} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{user?.profile?.full_name || 'Admin User'}</span>
                <span className="text-xs text-indigo-400 font-medium">Super Admin</span>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-3 w-full flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-white sm:px-6 lg:px-8">
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
            <button onClick={() => navigate('/admin/notifications')} className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <Bell className="w-6 h-6" />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <button onClick={() => navigate('/admin/settings')} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              <UserAvatar avatarUrl={user?.avatarUrl} name={user?.profile?.full_name || 'Admin User'} size="sm" />
              <span className="hidden sm:block">{user?.profile?.full_name || 'Admin User'}</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-slate-50">
          <div className="py-4 px-4 sm:px-5 lg:px-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
