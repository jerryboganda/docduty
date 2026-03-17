import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Filter, RefreshCw, Download } from 'lucide-react';
import { api } from '../../lib/api';
import { formatRelative, formatDateTime } from '../../lib/dateUtils';
import { exportToCsv } from '../../lib/csv';
import { useToast } from '../../contexts/ToastContext';
import type { NotificationsResponse } from '../../types/api';

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

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread' ? '&unreadOnly=true' : '';
      const data = await api.get<NotificationsResponse>(`/notifications?page=${page}&limit=50${unreadOnly}`);
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleExport = () => {
    exportToCsv('admin_notifications', notifications.map(n => ({
      Type: n.type,
      Title: n.title,
      Body: n.body,
      Read: n.is_read ? 'Yes' : 'No',
      Date: formatDateTime(n.created_at),
    })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">System Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFilter(f => f === 'all' ? 'unread' : 'all'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === 'unread' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filter === 'unread' ? 'Unread' : 'All'}
          </button>
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={fetch_} className="p-1.5 text-slate-400 hover:text-slate-600" aria-label="Refresh notifications">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-slate-600 w-8"></th>
                <th className="px-4 py-2.5 font-semibold text-slate-600">Type</th>
                <th className="px-4 py-2.5 font-semibold text-slate-600">Title</th>
                <th className="px-4 py-2.5 font-semibold text-slate-600 hidden lg:table-cell">Body</th>
                <th className="px-4 py-2.5 font-semibold text-slate-600 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && notifications.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No notifications</td></tr>
              ) : (
                notifications.map(n => (
                  <tr key={n.id} className={`transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-4 py-2.5">
                      {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                        {n.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{n.title}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell max-w-xs truncate">{n.body}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 text-xs whitespace-nowrap">{formatRelative(n.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {loading && notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No notifications</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-lg border border-slate-200 p-3 ${!n.is_read ? 'border-l-4 border-l-indigo-500' : ''}`}>
              <div className="flex items-start gap-2">
                {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${typeColors[n.type] || 'bg-slate-100 text-slate-600'}`}>
                      {n.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">{formatRelative(n.created_at)}</span>
                  </div>
                  <p className="font-medium text-sm text-slate-900">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
