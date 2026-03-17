import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Clock, UserCircle, ShieldAlert, 
  ChevronRight, FileText, Database, Activity, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../lib/support';
import type { ApiAuditLog, AuditLogsResponse } from '../../types/api';

interface AuditLogView extends ApiAuditLog {
  actor: string;
  target: string;
  time: string;
  type: string;
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogs() {
  const toast = useToast();
  const [selectedLog, setSelectedLog] = useState<AuditLogView | null>(null);
  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * PAGE_SIZE;
      const data = await api.get<AuditLogsResponse>(`/admin/audit-logs?limit=${PAGE_SIZE}&offset=${offset}`);
      setTotalLogs(data.total || 0);
      setLogs((data.logs || []).map((log: ApiAuditLog) => ({
        ...log,
        actor: log.user_phone || 'System',
        action: typeof log.action === 'string'
          ? log.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'Action',
        target: log.entity_id?.slice(0, 8) || 'N/A',
        time: timeAgo(log.created_at),
        type: log.entity_type === 'policy' ? 'policy_change' :
              (typeof log.action === 'string' && log.action.includes('dispute')) ? 'dispute_action' :
              (typeof log.action === 'string' && (log.action.includes('user') || log.action.includes('verify') || log.action.includes('suspend'))) ? 'user_action' :
              'system_event',
      })));
    } catch (err: unknown) {
      toast.error('Failed to load audit logs', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const filteredLogs = logs.filter((log: AuditLogView) => {
    if (!search && !typeFilter) return true;
    const s = search.toLowerCase();
    const matchesSearch = !search || log.actor?.toLowerCase().includes(s) || log.action?.toLowerCase().includes(s) || log.target?.toLowerCase().includes(s);
    const matchesType = !typeFilter || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">Track all administrative actions and system events.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by actor, action, or target..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-200 bg-slate-50/50">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
              <option value="">All Types</option>
              <option value="policy_change">Policy Change</option>
              <option value="user_action">User Action</option>
              <option value="dispute_action">Dispute Action</option>
              <option value="system_event">System Event</option>
            </select>
            {typeFilter && <button onClick={() => setTypeFilter('')} className="text-xs text-indigo-600 font-medium hover:underline">Clear</button>}
          </div>
        )}

        {/* Log List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => setSelectedLog(log)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 mt-1 ${
                  log.type === 'system_event' ? 'bg-slate-100 border-slate-200 text-slate-500' :
                  log.type === 'policy_change' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                  log.type === 'dispute_action' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                  'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}>
                  {log.type === 'system_event' ? <Database className="w-5 h-5" /> :
                   log.type === 'policy_change' ? <FileText className="w-5 h-5" /> :
                   log.type === 'dispute_action' ? <ShieldAlert className="w-5 h-5" /> :
                   <UserCircle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{log.action}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                      {log.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    <span className="font-bold text-slate-700">{log.actor}</span> on <span className="font-bold text-slate-700">{log.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time} • {log.id}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          ))}
        </div>
        {/* Pagination */}
        {totalLogs > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {page} of {Math.ceil(totalLogs / PAGE_SIZE)} ({totalLogs} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(totalLogs / PAGE_SIZE)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Log Details</h3>
                <p className="text-xs text-slate-500">{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <ChevronRight className="w-6 h-6 rotate-90 sm:rotate-180" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">Actor</p>
                  <p className="text-sm font-bold text-slate-900">{selectedLog.actor}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">Timestamp</p>
                  <p className="text-sm font-bold text-slate-900">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : selectedLog.time}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">Action</p>
                  <p className="text-sm font-bold text-slate-900">{selectedLog.action} on {selectedLog.target}</p>
                </div>
              </div>

              {(selectedLog.old_value || selectedLog.new_value) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" /> State Changes
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Before</p>
                      <pre className="text-[10px] font-mono text-red-900 whitespace-pre-wrap">
{formatJson(selectedLog.old_value)}
                      </pre>
                    </div>
                    <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">After</p>
                      <pre className="text-[10px] font-mono text-emerald-900 whitespace-pre-wrap">
{formatJson(selectedLog.new_value)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Audit Note</p>
                <p className="text-sm text-slate-600 italic">
                  {selectedLog.new_value?.note || selectedLog.new_value?.resolutionNotes || selectedLog.new_value?.internalNote || 'No additional note captured for this action.'}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
