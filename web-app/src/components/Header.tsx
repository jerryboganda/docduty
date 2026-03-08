import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { api } from '../lib/api';
import { subscribeToChannel, unsubscribeFromChannel } from '../lib/realtime';

const pageTitles: Record<string, string> = {
  '/facility': 'Dashboard',
  '/facility/post': 'Post a Shift',
  '/facility/shifts': 'Shifts',
  '/facility/bookings': 'Bookings',
  '/facility/attendance': 'Attendance',
  '/facility/payments': 'Payments',
  '/facility/disputes': 'Disputes',
  '/facility/messages': 'Messages',
  '/facility/ratings': 'Ratings & History',
  '/facility/settings': 'Settings',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.profile?.name || user?.phone || 'User';
  const currentTitle = pageTitles[location.pathname] || 'Dashboard';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      api.get<any>('/notifications').then(data => {
        if (data?.notifications) {
          setUnreadCount(data.notifications.filter((n: any) => !n.is_read).length);
        }
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    // Real-time subscription (graceful fallback if Soketi unavailable)
    const channelName = user?.id ? `private-user.${user.id}` : null;
    if (channelName) {
      const channel = subscribeToChannel(channelName);
      if (channel) {
        channel.bind('new-notification', () => {
          setUnreadCount(prev => prev + 1);
        });
      }
    }

    return () => {
      clearInterval(interval);
      if (channelName) unsubscribeFromChannel(channelName);
    };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/facility/notifications')}
          className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <Bell className="w-6 h-6" />
        </button>
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <button 
          onClick={() => navigate('/facility/settings')}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <UserAvatar avatarUrl={user?.avatarUrl} name={displayName} size="sm" />
          <span className="hidden sm:block">{displayName}</span>
        </button>
      </div>
    </header>
  );
}
