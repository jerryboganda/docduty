import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, Home, Search, CalendarDays, 
  MapPin, Wallet, AlertTriangle, MessageSquare, User, Settings, X, Stethoscope, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import UserAvatar from '../UserAvatar';
import { subscribeToChannel, unsubscribeFromChannel } from '../../lib/realtime';
import { useDoctorVerification } from '../../hooks/useDoctorVerification';
import type { NotificationsResponse } from '../../types/api';

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
  const [showVerificationGate, setShowVerificationGate] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { summary } = useDoctorVerification();

  const doctorName = user?.profile && 'full_name' in user.profile ? user.profile.full_name : 'Doctor';

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
      api.get<NotificationsResponse>('/notifications?unreadOnly=true&limit=1').then(data => {
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

  useEffect(() => {
    if (!summary) {
      return;
    }

    const gatedStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED', 'REVERIFICATION_REQUIRED'];
    if (!gatedStatuses.includes(summary.status)) {
      setShowVerificationGate(false);
      return;
    }

    const dismissalKey = `docduty.verificationGate.dismissed.${summary.status}`;
    const lastDismissed = localStorage.getItem(dismissalKey);
    const lastDismissedDay = lastDismissed ? new Date(lastDismissed).toDateString() : '';
    const today = new Date().toDateString();
    setShowVerificationGate(lastDismissedDay !== today);
  }, [summary]);

  const dismissVerificationGate = () => {
    if (summary) {
      localStorage.setItem(`docduty.verificationGate.dismissed.${summary.status}`, new Date().toISOString());
    }
    setShowVerificationGate(false);
  };

  const verificationTone = summary?.status === 'APPROVED'
    ? 'text-emerald-600'
    : summary?.status === 'REJECTED'
      ? 'text-red-600'
      : 'text-amber-600';

  return (
    <div className="flex h-screen bg-background-light font-display antialiased overflow-hidden">
      {showVerificationGate && summary && (
        <div className="fixed inset-0 z-[60] bg-slate-950/65 backdrop-blur-sm p-2 sm:p-4 lg:p-6 flex items-end justify-center lg:items-center">
          <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] lg:max-h-[min(88dvh,920px)]">
            <div className="grid flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <div className="border-b border-slate-200 bg-[linear-gradient(160deg,#f7fcfa_0%,#ebf6f0_48%,#fdfaf2_100%)] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:border-slate-200 lg:p-10 xl:p-12">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Doctor Activation
                </span>
                <h2 className="mt-5 max-w-lg text-[2rem] leading-tight font-bold tracking-tight text-slate-900 sm:text-[2.35rem] lg:text-[2.7rem]">
                  Complete your doctor verification
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px] lg:max-w-xl">
                  DocDuty requires professional verification before doctors can apply for shifts, confirm bookings, or participate in staffing workflows. You can browse first, but your account stays locked for transactions until approval.
                </p>
                <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:max-w-2xl">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Required details</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-900">Identity, PMDC, qualifications, city preferences, and supporting documents.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">What unlocks</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-900">Shift applications, booking confirmation, and staffing participation after approval.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col p-5 sm:p-7 lg:min-h-full lg:p-8 xl:p-10">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current status</p>
                  <p className="mt-2 text-[1.85rem] leading-tight font-bold text-slate-900 sm:text-[2.1rem]">{summary.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{summary.description}</p>
                </div>

                <div className="mt-5 flex-1 space-y-3 text-sm text-slate-600 sm:mt-6">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">1</span>
                    <div>
                      <p className="font-semibold text-slate-900">Start your secure verification draft</p>
                      <p className="mt-1 leading-6">We autosave your progress so you can finish later.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
                    <div>
                      <p className="font-semibold text-slate-900">Upload your PMDC, MBBS, and identity documents</p>
                      <p className="mt-1 leading-6">Our reviewers compare your entered information against the evidence you submit.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">3</span>
                    <div>
                      <p className="font-semibold text-slate-900">Wait for admin review</p>
                      <p className="mt-1 leading-6">We notify you in-app once your account is approved, rejected, or needs updates.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:mt-6 sm:pt-6 lg:mt-8">
                  <button
                    onClick={() => {
                      setShowVerificationGate(false);
                      navigate('/doctor/profile');
                    }}
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                  >
                    {summary.primaryCta}
                  </button>
                  <button
                    onClick={dismissVerificationGate}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Complete Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user?.avatarUrl} name={doctorName} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{doctorName}</span>
                <span className={`text-xs font-medium ${verificationTone}`}>{summary?.badge || 'Verification Required'}</span>
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
