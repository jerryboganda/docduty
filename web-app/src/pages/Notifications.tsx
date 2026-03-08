import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw, ChevronDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatRelative } from '../lib/dateUtils';
import { useToast } from '../contexts/ToastContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | string | null;
  is_read: boolean;
  created_at: string;
}

const typeColors: Record<string, string> = {
  shift_offer: 'bg-blue-100 text-blue-700',
  booking_update: 'bg-emerald-100 text-emerald-700',
  booking_confirmed: 'bg-emerald-100 text-emerald-700',
  booking_cancelled: 'bg-red-100 text-red-700',
  dispute_update: 'bg-amber-100 text-amber-700',
  dispute_opened: 'bg-amber-100 text-amber-700',
  payment: 'bg-violet-100 text-violet-700',
  payout_completed: 'bg-violet-100 text-violet-700',
  message: 'bg-sky-100 text-sky-700',
  verification_update: 'bg-teal-100 text-teal-700',
  rating: 'bg-yellow-100 text-yellow-700',
  system_alert: 'bg-slate-100 text-slate-700',
  attendance: 'bg-indigo-100 text-indigo-700',
  no_show: 'bg-red-100 text-red-700',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread' ? '&unreadOnly=true' : '';
      const data = await api.get<any>(`/notifications?page=${page}&limit=30${unreadOnly}`);
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    try {
      const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
      if (data?.shiftId) navigate(`/facility/shifts/${data.shiftId}`);
      else if (data?.bookingId) navigate(`/facility/bookings/${data.bookingId}`);
      else if (data?.disputeId) navigate(`/facility/disputes/${data.disputeId}`);
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFilter(f => f === 'all' ? 'unread' : 'all'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === 'unread' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filter === 'unread' ? 'Unread Only' : 'All'}
          </button>
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
          <button onClick={fetchNotifications} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                !n.is_read ? 'bg-blue-50/40' : ''
              }`}
            >
              {/* Unread dot */}
              <div className="pt-1.5 shrink-0">
                {!n.is_read ? (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-transparent rounded-full" />
                )}
              </div>
              {/* Type badge */}
              <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                {n.type.replace(/_/g, ' ')}
              </span>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
              </div>
              {/* Time */}
              <span className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">{formatRelative(n.created_at)}</span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
