import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Send, CheckCircle, Clock, CheckSquare, AlertCircle, 
  Wallet, Plus, Calendar, Eye, AlertTriangle, Info, MapPin, 
  RefreshCw, XCircle, UserCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface DashboardData {
  kpis: { label: string; value: string; icon: any; color: string; bg: string; alert?: boolean }[];
  alerts: { id: number; type: string; message: string; action: string; time: string }[];
  schedule: { id: string; role: string; time: string; doctor: string; status: string; pay: string; geo: string }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [dashData, setDashData] = useState<DashboardData>({
    kpis: [],
    alerts: [],
    schedule: [],
  });

  const loadDashboard = useCallback(async () => {
    setViewState('loading');
    try {
      // Fetch shifts, bookings, disputes in parallel
      const [shiftsRes, bookingsRes, disputesRes] = await Promise.all([
        api.get<any>('/shifts?status=open&limit=100'),
        api.get<any>('/bookings?limit=100'),
        api.get<any>('/disputes?limit=100'),
      ]);

      const shifts = shiftsRes?.shifts || shiftsRes || [];
      const bookings = bookingsRes?.bookings || bookingsRes || [];
      const disputes = disputesRes?.disputes || disputesRes || [];

      const openShifts = Array.isArray(shifts) ? shifts.filter((s: any) => s.status === 'open' || s.status === 'dispatching') : [];
      const offersCount = Array.isArray(shifts) ? shifts.reduce((n: number, s: any) => n + (s.offers_count || 0), 0) : 0;
      const confirmedBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'confirmed') : [];
      const inProgressBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'in_progress') : [];
      const completedBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'completed') : [];
      const openDisputes = Array.isArray(disputes) ? disputes.filter((d: any) => d.status === 'open' || d.status === 'under_review') : [];

      const kpis = [
        { label: 'Open Shifts', value: String(openShifts.length), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Offers Sent', value: String(offersCount), icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Confirmed Bookings', value: String(confirmedBookings.length), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'In-Progress', value: String(inProgressBookings.length), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Completed', value: String(completedBookings.length), icon: CheckSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
        { label: 'Disputes Open', value: String(openDisputes.length), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', alert: openDisputes.length > 0 },
        { label: 'Pending Payments', value: '0', icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-100' },
      ];

      // Build alerts from recent notifications or disputes
      const alerts: DashboardData['alerts'] = [];
      if (openDisputes.length > 0) {
        alerts.push({
          id: 1,
          type: 'warning',
          message: `${openDisputes.length} dispute(s) require your attention`,
          action: 'Review',
          time: 'Active',
        });
      }
      if (openShifts.length === 0 && confirmedBookings.length === 0) {
        alerts.push({
          id: 2,
          type: 'info',
          message: 'No active shifts or bookings. Post a new shift to get started.',
          action: 'Post Shift',
          time: 'Now',
        });
      }

      // Build schedule from today's bookings
      const schedule = [...confirmedBookings, ...inProgressBookings].slice(0, 5).map((b: any, i: number) => ({
        id: b.id || `B-${i}`,
        role: b.shift_role || b.role || 'Duty Doctor',
        time: b.start_time && b.end_time ? `${new Date(b.start_time).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.end_time).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}` : 'TBD',
        doctor: b.doctor_name || 'Assigned Doctor',
        status: b.status === 'in_progress' ? 'In-Progress' : b.status === 'confirmed' ? 'Confirmed' : 'Pending',
        pay: b.offered_rate ? `Rs. ${Number(b.offered_rate).toLocaleString()}` : 'TBD',
        geo: b.checkin_verified ? 'Verified' : 'Pending',
      }));

      setDashData({ kpis, alerts, schedule });
      setViewState(openShifts.length === 0 && bookings.length === 0 ? 'empty' : 'success');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const facilityName = user?.profile?.name || 'your facility';

  // Render States
  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load dashboard</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your facility data. Please check your connection and try again.</p>
        <button onClick={loadDashboard} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
          <Calendar className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Welcome to DocDuty</h2>
        <p className="text-slate-500 text-center max-w-md">You haven't posted any shifts yet. Create your first shift to start finding verified doctors for your facility.</p>
        <Link to="/facility/post" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Post Your First Shift
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header & State Simulator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500">Welcome back, {facilityName}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboard} className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link to="/facility/post" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Post Shift
          </Link>
        </div>
      </div>

      {/* Quick Actions (Mobile Prominent) */}
      <div className="grid grid-cols-3 gap-3 sm:hidden">
        <button onClick={() => navigate('/facility/post')} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-primary hover:bg-slate-50">
          <Plus className="w-6 h-6" />
          <span className="text-xs font-medium text-slate-700">Post Shift</span>
        </button>
        <button onClick={() => navigate('/facility/shifts')} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-primary hover:bg-slate-50">
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium text-slate-700">Open Shifts</span>
        </button>
        <button onClick={() => navigate('/facility/bookings')} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-primary hover:bg-slate-50">
          <CheckSquare className="w-6 h-6" />
          <span className="text-xs font-medium text-slate-700">Bookings</span>
        </button>
      </div>

      {/* Alerts Panel */}
      {dashData.alerts.length > 0 && (
      <div className="space-y-3">
        {dashData.alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
              alert.type === 'critical' ? 'bg-red-50 border-red-200' :
              alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {alert.type === 'critical' ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" /> :
               alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" /> :
               <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />}
              <div>
                <p className={`text-sm font-medium ${
                  alert.type === 'critical' ? 'text-red-900' :
                  alert.type === 'warning' ? 'text-amber-900' :
                  'text-blue-900'
                }`}>
                  {alert.message}
                </p>
                <p className={`text-xs mt-0.5 ${
                  alert.type === 'critical' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-amber-600' :
                  'text-blue-600'
                }`}>
                  {alert.time}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (alert.action === 'Review') navigate('/facility/disputes');
                else if (alert.action === 'Post Shift') navigate('/facility/post');
              }}
              className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              alert.type === 'critical' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
              alert.type === 'warning' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
              'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}>
              {alert.action}
            </button>
          </div>
        ))}
      </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {dashData.kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-slate-300 transition-colors">
            {kpi.alert && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Today's Schedule</h2>
          <select className="text-sm border-slate-200 rounded-lg text-slate-700 focus:ring-primary focus:border-primary py-1.5 pl-3 pr-8">
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This Week</option>
          </select>
        </div>
        
        <div className="divide-y divide-slate-200">
          {dashData.schedule.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No scheduled shifts today</p>
            </div>
          ) : dashData.schedule.map((shift) => (
            <div key={shift.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                  <UserCircle className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{shift.doctor}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      shift.status === 'In-Progress' ? 'bg-amber-100 text-amber-700' :
                      shift.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {shift.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{shift.role}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {shift.time}</span>
                    <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> {shift.pay}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin className={`w-4 h-4 ${shift.geo === 'Verified' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className={shift.geo === 'Verified' ? 'text-emerald-700' : 'text-slate-500'}>
                    Geofence: {shift.geo}
                  </span>
                </div>
                <button onClick={() => navigate(`/facility/bookings/${shift.id}`)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                  <Eye className="w-5 h-5" />
                </button>
              </div>

            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <Link to="/facility/shifts" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
