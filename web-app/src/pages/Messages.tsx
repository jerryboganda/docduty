import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MessageSquare, UserCircle, RefreshCw, Send, ArrowLeft, AlertTriangle, Shield
} from 'lucide-react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import { formatRelative, formatTime } from '../lib/dateUtils';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChannel, unsubscribeFromChannel } from '../lib/realtime';
import type { ConversationsResponse, MessagesResponse } from '../types/api';

interface Conversation {
  booking_id: string;
  other_user_name?: string;
  other_party_name?: string;
  doctor_name?: string;
  facility_name?: string;
  shift_title: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
  message_count?: number;
}

interface Message {
  id: string;
  sender_id: string;
  senderId?: string;
  sender_name: string;
  content: string;
  phi_detected: number;
  created_at: string;
  createdAt?: string;
  sent_at?: string;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [convError, setConvError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    try {
      setConvError(false);
      const data = await api.get<ConversationsResponse>('/messages/conversations');
      setConversations(data.conversations || []);
    } catch {
      if (conversations.length === 0) {
        setConvError(true);
      } else {
        toast.error('Failed to refresh conversations');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Poll conversations every 15s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (bookingId: string) => {
    try {
      const data = await api.get<MessagesResponse>(`/messages/${bookingId}`);
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { toast.error('Failed to load messages'); }
  }, []);

  // Real-time chat subscription via Soketi
  useEffect(() => {
    if (!activeBookingId) return;
    const channelName = `presence-messages.${activeBookingId}`;
    const channel = subscribeToChannel(channelName);
    if (channel) {
      channel.bind('new-message', (data: Message) => {
        setMessages(prev => {
          // Deduplicate: skip if message with same ID already exists
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
    }
    return () => { unsubscribeFromChannel(channelName); };
  }, [activeBookingId]);

  // Poll active thread every 5s
  useEffect(() => {
    if (!activeBookingId) return;
    fetchMessages(activeBookingId);
    const interval = setInterval(() => fetchMessages(activeBookingId), 5000);
    return () => clearInterval(interval);
  }, [activeBookingId, fetchMessages]);

  const selectConversation = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeBookingId || sending) return;
    setSending(true);
    try {
      await api.post(`/messages/${activeBookingId}`, { content: newMessage.trim() });
      setNewMessage('');
      fetchMessages(activeBookingId);
      fetchConversations();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
    setSending(false);
  };

  const filtered = conversations.filter(c =>
    !search ||
    (c.other_party_name || c.other_user_name || c.doctor_name || c.facility_name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.shift_title?.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = conversations.find(c => c.booking_id === activeBookingId);

  const getMessageTimestamp = (message: Message): string => {
    return message.created_at || message.createdAt || message.sent_at || '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Messages</h1>
        <span className="text-xs text-slate-400">{conversations.length} conversations</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex h-[calc(100vh-12rem)]">
        {/* Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 ${activeBookingId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 text-slate-300 animate-spin" /></div>
            ) : convError ? (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-red-300" />
                <p className="text-slate-500 font-medium">Failed to load conversations</p>
                <button onClick={fetchConversations} className="mt-2 px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20">Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-slate-400">
                <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                No conversations
              </div>
            ) : filtered.map(c => (
              <div
                key={c.booking_id}
                onClick={() => selectConversation(c.booking_id)}
                className={`px-3 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 ${activeBookingId === c.booking_id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <UserCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{c.other_party_name || c.other_user_name || c.doctor_name || c.facility_name || 'Unknown'}</h3>
                      <span className="text-[10px] text-slate-400 shrink-0">{c.last_message_at ? formatRelative(c.last_message_at) : ''}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.shift_title}</p>
                    <p className={`text-xs truncate mt-0.5 ${(c.unread_count || c.message_count || 0) > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>{c.last_message || 'No messages'}</p>
                  </div>
                  {(c.unread_count || c.message_count || 0) > 0 && (
                    <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{c.unread_count || c.message_count || 0}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Thread */}
        <div className={`flex-1 flex flex-col ${activeBookingId ? 'flex' : 'hidden md:flex'}`}>
          {!activeBookingId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-1">Choose from active booking chats</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <button onClick={() => setActiveBookingId(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-700" aria-label="Go back">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <UserCircle className="w-8 h-8 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{activeConv?.other_party_name || activeConv?.other_user_name || activeConv?.doctor_name || activeConv?.facility_name || 'Chat'}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{activeConv?.shift_title}</p>
                </div>
              </div>

              {/* PHI notice */}
              <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-amber-700 text-[11px]">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>No patient data (PHI). Logistics only.</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">No messages yet — start the conversation</p>
                ) : messages.map(m => {
                  const senderId = m.sender_id || m.senderId;
                  const isMe = !!user?.id && senderId === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        m.phi_detected
                          ? 'bg-red-50 border border-red-200 text-red-800'
                          : isMe
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                      }`}>
                        {m.phi_detected ? (
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="text-xs italic">⚠ PHI detected — message flagged</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>{formatTime(getMessageTimestamp(m))}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none max-h-24"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
