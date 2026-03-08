import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Download, Calendar,
  TrendingUp, TrendingDown, Users, Activity, DollarSign, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { exportToCsv } from '../../lib/csv';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const PERIOD_MAP: Record<string, { days: number }> = {
  'Last 7 Days': { days: 7 },
  'Last 30 Days': { days: 30 },
  'Last 90 Days': { days: 90 },
  'Year to Date': { days: 365 },
};

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function AnalyticsExports() {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { days } = PERIOD_MAP[dateRange] || { days: 30 };
      const endDate = toISODate(new Date());
      const startDate = toISODate(new Date(Date.now() - days * 86400000));
      const data = await api.get(`/admin/analytics?startDate=${startDate}&endDate=${endDate}&period=${days}d`);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const totalBookings = analytics?.bookings?.total || 0;
  const grossVolume = analytics?.financials?.totalPayouts || 0;
  const activeDoctors = analytics?.users?.totalDoctors || analytics?.shifts?.total || 0;
  const disputeRate = totalBookings > 0 ? ((analytics?.disputes?.total || 0) / totalBookings * 100).toFixed(1) : '0.0';

  const trends = analytics?.trends || {};
  const timeSeries: any[] = analytics?.timeSeries || [];

  const renderTrendBadge = (value: number | undefined, invertColor = false) => {
    const v = value ?? 0;
    const isUp = v >= 0;
    const color = invertColor ? (isUp ? 'red' : 'emerald') : (isUp ? 'emerald' : 'red');
    const Icon = isUp ? TrendingUp : TrendingDown;
    return (
      <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-lg flex items-center gap-1`}>
        <Icon className="w-3 h-3" /> {isUp ? '+' : ''}{v.toFixed(0)}%
      </span>
    );
  };

  const handleExportFinancials = () => {
    if (!analytics) return;
    const rows = timeSeries.map((d: any) => ({
      date: d.date,
      bookings: d.bookings,
      revenue: d.revenue,
      shifts: d.shifts,
    }));
    exportToCsv(`docduty-financials-${toISODate(new Date())}.csv`, rows);
  };

  const handleExportUsers = () => {
    if (!analytics?.topDoctors) return;
    exportToCsv(`docduty-top-doctors-${toISODate(new Date())}.csv`, analytics.topDoctors);
  };

  const handleExportOperational = () => {
    if (!analytics) return;
    const rows = [{
      total_bookings: totalBookings,
      total_disputes: analytics.disputes?.total || 0,
      dispute_rate: disputeRate + '%',
      no_shows: analytics.bookings?.noShow || 0,
      completed: analytics.bookings?.completed || 0,
      platform_fees: analytics.financials?.totalPlatformFees || 0,
      total_payouts: grossVolume,
    }];
    exportToCsv(`docduty-operational-${toISODate(new Date())}.csv`, rows);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analytics & Exports</h1>
          <p className="text-sm text-slate-500">View platform performance metrics and generate reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              {Object.keys(PERIOD_MAP).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <button onClick={handleExportFinancials} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              {renderTrendBadge(trends.bookings)}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Bookings</p>
            <h3 className="text-2xl font-black text-slate-900">{totalBookings.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              {renderTrendBadge(trends.revenue)}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Gross Volume (PKR)</p>
            <h3 className="text-2xl font-black text-slate-900">{grossVolume >= 1000000 ? (grossVolume / 1000000).toFixed(1) + 'M' : grossVolume.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              {renderTrendBadge(trends.users)}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Active Doctors</p>
            <h3 className="text-2xl font-black text-slate-900">{activeDoctors.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              {renderTrendBadge(trends.disputes, true)}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Dispute Rate</p>
            <h3 className="text-2xl font-black text-slate-900">{disputeRate}%</h3>
          </div>
        </div>

        {/* Charts & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Main Chart — Recharts */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Booking Volume & Revenue</h3>
              <span className="text-xs text-slate-400">{dateRange}</span>
            </div>
            <div className="flex-1 min-h-[300px]">
              {timeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} dot={false} name="Bookings" />
                    <Line yAxisId="left" type="monotone" dataKey="shifts" stroke="#10b981" strokeWidth={2} dot={false} name="Shifts Posted" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} name="Revenue (PKR)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">
                  No data available for this period.
                </div>
              )}
            </div>
          </div>

          {/* Export Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-6">Generate Reports</h3>
            
            <div className="space-y-4">
              <button onClick={handleExportFinancials} className="w-full p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Financial Ledger
                  </h4>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500">Detailed breakdown of all settlements, fees, and escrow transfers.</p>
              </button>

              <button onClick={handleExportUsers} className="w-full p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> User Activity
                  </h4>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500">Doctor and facility engagement metrics, signups, and active users.</p>
              </button>

              <button onClick={handleExportOperational} className="w-full p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-600" /> Operational Health
                  </h4>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500">Dispute rates, no-shows, late cancellations, and resolution times.</p>
              </button>
            </div>
          </div>

        </div>

        {/* Top Doctors & Top Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Doctors */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Top Doctors by Rating</h3>
            {analytics?.topDoctors?.length > 0 ? (
              <div className="space-y-3">
                {analytics.topDoctors.slice(0, 5).map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{doc.total_ratings} reviews</span>
                      <span className="text-sm font-bold text-amber-600">{Number(doc.avg_rating).toFixed(1)} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No data available.</p>
            )}
          </div>

          {/* Top Cities Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Shifts by City</h3>
            {analytics?.topCities?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.topCities.slice(0, 6)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="shift_count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Shifts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">No city data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
