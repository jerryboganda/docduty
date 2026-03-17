import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../lib/support';
import { 
  Search, Filter, Building2, ChevronRight, MapPin, 
  QrCode, RefreshCw, Clock, Edit3, ShieldCheck
} from 'lucide-react';
import { api } from '../../lib/api';
import type { ApiFacilityLocation, FacilityLocationsResponse } from '../../types/api';

interface FacilityLocationView {
  id: string;
  displayId: string;
  facility: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  qrRotationMinutes: number;
  qrRotation: string;
  geofenceRadiusM: number;
  geofence: string;
  requireGeofence: boolean;
}

export default function FacilitiesLocations() {
  const [selectedLocation, setSelectedLocation] = useState<FacilityLocationView | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrAuditNote, setQrAuditNote] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);
  const [locations, setLocations] = useState<FacilityLocationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<FacilityLocationsResponse>('/admin/facilities');
      const locs = (data.facilities || data.locations || []).map((f: ApiFacilityLocation) => ({
        id: f.id,
        displayId: f.id?.slice(0, 8) || f.id,
        facility: f.facility_name || f.name || 'Facility',
        name: f.location_name || f.name || 'Location',
        address: f.address || 'N/A',
        latitude: f.latitude || null,
        longitude: f.longitude || null,
        status: f.is_active === false ? 'Inactive' : 'Active',
        qrRotationMinutes: f.qr_rotation_minutes || 15,
        qrRotation: `${f.qr_rotation_minutes || 15} mins`,
        geofenceRadiusM: f.geofence_radius || 200,
        geofence: `${f.geofence_radius || 200}m`,
        requireGeofence: f.require_geofence !== false,
      }));
      setLocations(locs);
    } catch (err: unknown) {
      toast.error('Failed to load facilities', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = !search || loc.facility.toLowerCase().includes(search.toLowerCase()) || loc.name.toLowerCase().includes(search.toLowerCase()) || loc.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGeofenceRadiusChange = async (radius: number) => {
    if (!selectedLocation) return;
    if (isNaN(radius) || radius < 50 || radius > 1000) { toast.error('Radius must be between 50 and 1000 meters'); return; }
    try {
      await api.put(`/facilities/locations/${selectedLocation.id}`, { geofenceRadiusM: radius });
      toast.success(`Geofence updated to ${radius}m`);
      setSelectedLocation({ ...selectedLocation, geofenceRadiusM: radius, geofence: `${radius}m` });
      fetchLocations();
    } catch (err: unknown) { toast.error('Failed to update: ' + getErrorMessage(err)); }
  };

  const handleQrIntervalChange = async (mins: number) => {
    if (!selectedLocation) return;
    if (![5, 10, 15, 30].includes(mins)) { toast.error('Interval must be 5, 10, 15, or 30 minutes'); return; }
    try {
      await api.put(`/facilities/locations/${selectedLocation.id}`, { qrRotateIntervalMin: mins });
      toast.success(`QR rotation interval updated to ${mins} min`);
      setSelectedLocation({ ...selectedLocation, qrRotationMinutes: mins, qrRotation: `${mins} mins` });
      fetchLocations();
    } catch (err: unknown) { toast.error('Failed to update: ' + getErrorMessage(err)); }
  };

  const handleRequireGeofenceToggle = async () => {
    if (!selectedLocation) return;
    const newVal = !selectedLocation.requireGeofence;
    try {
      await api.put(`/facilities/locations/${selectedLocation.id}`, { requireGeofence: newVal });
      toast.success(`Geofence requirement ${newVal ? 'enabled' : 'disabled'}`);
      setSelectedLocation({ ...selectedLocation, requireGeofence: newVal });
      fetchLocations();
    } catch (err: unknown) { toast.error('Failed to update: ' + getErrorMessage(err)); }
  };

  const handleGenerateQr = async () => {
    if (!selectedLocation || !qrAuditNote.trim()) {
      toast.error('Audit note is required');
      return;
    }
    try {
      setQrGenerating(true);
      await api.post(`/facilities/locations/${selectedLocation.id}/rotate-qr`, { auditNote: qrAuditNote.trim() });
      toast.success('New QR code generated successfully');
      setQrModalOpen(false);
      setQrAuditNote('');
    } catch (err: unknown) {
      toast.error('Failed to generate QR: ' + getErrorMessage(err));
    } finally {
      setQrGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading facilities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Facilities & Locations</h1>
        <p className="text-sm text-slate-500">Manage facility branches, geofences, and QR codes.</p>
      </div>

      {!selectedLocation ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search locations or facilities..." 
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
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-indigo-600 font-medium hover:underline">Clear</button>}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredLocations.map((loc) => (
              <div 
                key={loc.id} 
                onClick={() => setSelectedLocation(loc)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        loc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {loc.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{loc.facility} • {loc.displayId}</p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{loc.address}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Location Detail Screen */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedLocation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedLocation.name}</h2>
                <p className="text-xs text-slate-500">{selectedLocation.facility} • {selectedLocation.displayId}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              selectedLocation.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {selectedLocation.status}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Column: Config */}
            <div className="space-y-6">
              
              {/* Address & Geofence */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" /> Location Details
                  </h3>
                  <button onClick={async () => {
                    const newRadius = prompt('Enter new geofence radius (50-1000m):', String(selectedLocation.geofenceRadiusM));
                    if (newRadius) {
                      await handleGeofenceRadiusChange(parseInt(newRadius));
                    }
                  }} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Address</p>
                    <p className="text-sm text-slate-900">{selectedLocation.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Coordinates</p>
                    <p className="text-sm font-mono text-slate-900">
                      {selectedLocation.latitude && selectedLocation.longitude
                        ? `${Number(selectedLocation.latitude).toFixed(4)}\u00B0 N, ${Number(selectedLocation.longitude).toFixed(4)}\u00B0 E`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Geofence Radius</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        className="flex-1 accent-indigo-600"
                        min="50"
                        max="1000"
                        step="50"
                        value={selectedLocation.geofenceRadiusM}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSelectedLocation({ ...selectedLocation, geofenceRadiusM: val, geofence: `${val}m` });
                        }}
                        onMouseUp={(e) => handleGeofenceRadiusChange(parseInt((e.target as HTMLInputElement).value))}
                        onTouchEnd={(e) => handleGeofenceRadiusChange(parseInt((e.target as HTMLInputElement).value))}
                      />
                      <span className="text-sm font-bold text-indigo-600 w-16 text-right">{selectedLocation.geofence}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Config */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" /> QR Rotation Settings
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Rotation Interval</p>
                      <p className="text-xs text-slate-500">How often the QR code refreshes</p>
                    </div>
                    <select
                      className="p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                      value={selectedLocation.qrRotationMinutes}
                      onChange={(e) => handleQrIntervalChange(parseInt(e.target.value))}
                    >
                      <option value={5}>5 mins</option>
                      <option value={10}>10 mins</option>
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Require Location</p>
                      <p className="text-xs text-slate-500">Must be within geofence to scan</p>
                    </div>
                    <button
                      onClick={handleRequireGeofenceToggle}
                      className={`w-10 h-5 rounded-full relative transition-colors ${selectedLocation.requireGeofence ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${selectedLocation.requireGeofence ? 'left-5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: QR Management */}
            <div className="space-y-6">
              
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <QrCode className="w-16 h-16 mx-auto text-indigo-400 mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-2">Manual QR Override</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                  Force generate a new QR code immediately. This invalidates the current code and resets the rotation timer.
                </p>
                <button 
                  onClick={() => setQrModalOpen(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Generate New QR
                </button>
              </div>

              {/* QR Rotation Info */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> QR Configuration
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Rotation interval</span>
                    <span className="font-medium text-slate-900">{selectedLocation.qrRotation}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Geofence enforced</span>
                    <span className="font-medium text-slate-900">{selectedLocation.requireGeofence ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Geofence radius</span>
                    <span className="font-medium text-slate-900">{selectedLocation.geofence}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* QR Generation Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Rotation</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to force a new QR code? Any doctor currently trying to scan the old code will fail.
              </p>
              
              <div className="text-left mb-6">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Audit Note (Required)</label>
                <input 
                  type="text"
                  value={qrAuditNote}
                  onChange={(e) => setQrAuditNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Requested by facility admin"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setQrModalOpen(false); setQrAuditNote(''); }}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateQr}
                  disabled={qrGenerating || !qrAuditNote.trim()}
                  className={`flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 ${qrGenerating || !qrAuditNote.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {qrGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
