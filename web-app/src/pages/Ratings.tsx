import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  Search, Filter, Star, UserCircle, RefreshCw, XCircle, 
  ChevronRight, CheckCircle, MessageSquare
} from 'lucide-react';
import { api } from '../lib/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface RatingItem {
  id: string;
  bookingId: string;
  doctor: string;
  role: string;
  date: string;
  rating: number | null;
  tags: string[];
  comment: string;
  status: string;
}

export default function Ratings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RatingItem | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [summary, setSummary] = useState({ avgRating: 0, completedShifts: 0, pendingRatings: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRatings = useCallback(async () => {
    try {
      setViewState('loading');
      // Get completed bookings for this facility
      const bookingsData = await api.get('/bookings?status=completed&limit=100');
      const ratingsData = await api.get('/ratings?limit=100');
      
      const ratedBookingIds = new Set((ratingsData.ratings || []).map((r: any) => r.booking_id));
      
      const mapped: RatingItem[] = (bookingsData.bookings || []).map((b: any) => {
        const rating = (ratingsData.ratings || []).find((r: any) => r.booking_id === b.id);
        return {
          id: b.id,
          bookingId: b.id,
          doctor: b.doctor_name || 'Unknown Doctor',
          role: b.specialty_name || b.shift_title || 'General',
          date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rating: rating?.score || null,
          tags: rating?.tags ? JSON.parse(rating.tags) : [],
          comment: rating?.comment || '',
          status: ratedBookingIds.has(b.id) ? 'Rated' : 'Pending Rating',
        };
      });

      const rated = mapped.filter(r => r.status === 'Rated');
      const avgRating = rated.length > 0 ? rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length : 0;
      
      setSummary({
        avgRating: Math.round(avgRating * 10) / 10,
        completedShifts: mapped.length,
        pendingRatings: mapped.filter(r => r.status === 'Pending Rating').length,
      });
      
      setRatings(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const filteredRatings = ratings.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return r.doctor.toLowerCase().includes(q) || r.bookingId.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
  });

  const handleRateClick = (booking: RatingItem) => {
    setSelectedBooking(booking);
    setSelectedStar(0);
    setRatingComment('');
    setSelectedTags([]);
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedBooking || selectedStar === 0) return;
    try {
      await api.post('/ratings', {
        bookingId: selectedBooking.bookingId,
        ratedUserId: selectedBooking.id, // will be resolved server-side
        score: selectedStar,
        comment: ratingComment,
        tags: JSON.stringify(selectedTags),
      });
      setRatingModalOpen(false);
      toast.success('Rating submitted');
      fetchRatings();
    } catch (err: any) {
      toast.error('Rating Failed', err.message || 'Failed to submit rating');
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading ratings history...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load ratings</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your rating history.</p>
        <button onClick={() => fetchRatings()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ratings & History</h1>
          <p className="text-sm text-slate-500">Review completed bookings and rate doctors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Average Rating Given</p>
            <p className="text-xl font-bold text-slate-900">{summary.avgRating} <span className="text-sm font-normal text-slate-500">/ 5</span></p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed Shifts</p>
            <p className="text-xl font-bold text-slate-900">{summary.completedShifts}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Ratings</p>
            <p className="text-xl font-bold text-slate-900">{summary.pendingRatings}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by doctor name or booking ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            />
          </div>
        </div>

        {viewState === 'empty' || filteredRatings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No completed bookings yet</h3>
            <p className="text-slate-500 text-center max-w-sm">
              Your rating history will appear here once shifts are completed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRatings.map(item => (
              <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{item.doctor}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === 'Rated' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{item.role} • {item.id}</p>
                    <p className="text-xs text-slate-500 mt-1">Completed on {item.date}</p>
                    
                    {item.status === 'Rated' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`w-4 h-4 ${star <= (item.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                          ))}
                        </div>
                        {item.comment && <p className="text-sm text-slate-700 italic">"{item.comment}"</p>}
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  {item.status === 'Pending Rating' ? (
                    <button onClick={() => handleRateClick(item)} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto">
                      Rate Doctor
                    </button>
                  ) : (
                    <button onClick={() => { setSelectedBooking(item); setRatingModalOpen(true); setSelectedStar(item.rating || 0); setRatingComment(item.comment || ''); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto">
                      View Notes
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Rate Doctor</h3>
              <button onClick={() => setRatingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-1">How was your experience with</p>
                <h4 className="text-lg font-bold text-slate-900">{selectedBooking.doctor}?</h4>
                <p className="text-xs text-slate-500 mt-1">{selectedBooking.role} • {selectedBooking.date}</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setSelectedStar(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star className={`w-10 h-10 ${
                      star <= (hoveredStar || selectedStar) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                    } transition-colors`} />
                  </button>
                ))}
              </div>

              {selectedStar > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Tags (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {['Punctual', 'Professional', 'Good Communication', 'Clinical Excellence', 'Team Player'].map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          className={`px-3 py-1.5 border rounded-full text-xs font-medium transition-colors ${
                            selectedTags.includes(tag) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Leave a comment (Optional)</label>
                    <textarea 
                      rows={3} 
                      placeholder="Share details about the doctor's performance..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setRatingModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button 
                disabled={selectedStar === 0}
                onClick={handleSubmitRating} 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                  selectedStar > 0 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

