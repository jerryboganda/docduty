import { useState, useEffect, useCallback } from 'react';
import { 
  Users, AlertTriangle, DollarSign, ShieldAlert, 
  ChevronRight, Activity, Clock, UserCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

interface DashboardData {
  pendingVerifications: number;
  openDisputes: number;
  pendingPayouts: number;
  suspiciousAttendance: number;
  recentVerifications: { name: string; type: string; submitted: string }[];
  recentDisputes: { id: string; issue: string; age: string; priority: string }[];
  alerts: { type: string; msg: string; time: string }[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const dashData = await api.get('/admin/dashboard');
      const d = dashData.dashboard || dashData;
      setData({
        pendingVerifications: d.pending_verifications ?? d.pendingVerifications ?? 0,
        openDisputes: d.open_disputes ?? d.openDisputes ?? 0,
        pendingPayouts: d.pending_payouts ?? d.pendingPayouts ?? 0,
        suspiciousAttendance: d.suspicious_attendance ?? d.suspiciousAttendance ?? 0,
        recentVerifications: (d.recent_verifications || []).map((v: any) => ({
          name: v.full_name || v.name || 'Unknown',
          type: v.role === 'doctor' ? 'Doctor' : 'Facility',
          submitted: v.created_at ? timeAgo(v.created_at) : 'Recently',
        })),
        recentDisputes: (d.recent_disputes || []).map((dp: any) => ({
          id: dp.id?.slice(0, 8) || 'DSP',
          issue: dp.description || dp.type || 'Dispute',
          age: dp.created_at ? timeAgo(dp.created_at) : 'Recently',
          priority: dp.priority || 'Medium',
        })),
        alerts: (d.alerts || []).map((a: any) => ({
          type: a.type || 'info',
          msg: a.message || a.msg || '',
          time: a.created_at ? timeAgo(a.created_at) : 'Recently',
        })),
      });
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      // Fallback to zeros
      setData({
        pendingVerifications: 0, openDisputes: 0, pendingPayouts: 0, suspiciousAttendance: 0,
        recentVerifications: [], recentDisputes: [], alerts: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Ops Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of platform operations and pending actions.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Action Req</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Pending Verifications</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{data.pendingVerifications}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{data.openDisputes > 0 ? `${Math.min(data.openDisputes, 2)} High Prio` : 'OK'}</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Open Disputes</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{data.openDisputes}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500">Payouts Pending</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{data.pendingPayouts}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500">Suspicious Attendance</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{data.suspiciousAttendance}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Queues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Verification Queue Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Verification Queue</h2>
              <button onClick={() => navigate('/admin/verifications')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.recentVerifications.length > 0 ? data.recentVerifications : [
                { name: 'No pending verifications', type: '-', submitted: '-' }
              ]).map((item, i) => (
                <div key={i} onClick={() => navigate('/admin/verifications')} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <UserCircle className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-slate-500">{item.type}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.submitted}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Disputes Queue Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Active Disputes</h2>
              <button onClick={() => navigate('/admin/disputes')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.recentDisputes.length > 0 ? data.recentDisputes : [
                { id: '-', issue: 'No active disputes', age: '-', priority: 'Low' }
              ]).map((item, i) => (
                <div key={i} onClick={() => navigate('/admin/disputes')} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900">{item.id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.issue}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.age}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Alerts Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-900">System Alerts</h2>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {(data.alerts.length > 0 ? data.alerts : [
              { type: 'info', msg: 'System operating normally', time: 'Now' }
            ]).map((alert, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.type === 'error' ? 'bg-red-500' : 
                  alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm text-slate-700 leading-snug">{alert.msg}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
