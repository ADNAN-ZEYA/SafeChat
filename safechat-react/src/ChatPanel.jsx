import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PhoneIcon, VideoCameraIcon, MagnifyingGlassIcon, PaperAirplaneIcon,
  XMarkIcon, ChatBubbleLeftEllipsisIcon, FlagIcon, FaceSmileIcon,
  ArrowPathIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { supabase, supabaseRealtimeEnabled } from './lib/supabaseClient';
import usePresence from './hooks/usePresence';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
  getMessages: async (username, otherUsername) => {
    const res = await fetch(`${API_BASE_URL}/get_feed/${username}?other_username=${encodeURIComponent(otherUsername)}`);
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
  getUsers: async (username) => {
    const res = await fetch(`${API_BASE_URL}/get_users/${username}`);
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
  sendMessage: async (senderUser, receiverUser, text) => {
    const res = await fetch(`${API_BASE_URL}/send_message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: senderUser, receiver_username: receiverUser, text }) });
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
  reportMessage: async (reporterUsername, messageId, reason, description) => {
    const res = await fetch(`${API_BASE_URL}/report_message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reporter_username: reporterUsername, message_id: messageId, reason, description }) });
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
};

// Generate a temporary ID for optimistic messages
let _tempIdCounter = 0;
function generateTempId() { return `_temp_${Date.now()}_${++_tempIdCounter}`; }

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sc-text-muted [animation-delay:-.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sc-text-muted [animation-delay:-.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sc-text-muted" />
    </span>
  );
}

function OnlineIndicator({ isOnline, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5';
  return (
    <span className={`${sizeClass} rounded-full border-2 border-sc-container-floor ${isOnline ? 'bg-green-500 animate-pulse-glow' : 'bg-sc-text-muted/40'}`}
      style={isOnline ? { boxShadow: '0 0 6px rgba(34,197,94,0.4)' } : {}} />
  );
}

function NoUsersView({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-sc-text/30 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 flex w-full max-w-md flex-col items-center rounded-card bg-sc-container-floor p-10 text-center elevation-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 rounded-full bg-sc-secondary/30 p-5 border border-sc-secondary/40 animate-float">
          <ChatBubbleLeftEllipsisIcon className="h-10 w-10 text-sc-primary/50" />
        </div>
        <h3 className="font-display text-lg font-semibold text-sc-text">No conversations yet</h3>
        <p className="mt-1 text-sm text-sc-text-muted">Find friends from the sidebar to start chatting.</p>
        <button onClick={onClose} className="mt-6 rounded-full bg-sc-secondary px-6 py-2.5 text-sm font-semibold text-sc-on-secondary hover-scale border border-sc-on-secondary/15 transition-all">Go Back</button>
      </div>
    </div>
  );
}

export default function ChatPanel({ onClose, currentUser, showNotification, initialActiveUser = null, refreshToken = 0 }) {
  const [activeUser, setActiveUser] = useState(initialActiveUser || '');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const chatWindowRef = useRef(null);
  const typingBroadcastTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);
  const isTypingBroadcastedRef = useRef(false);
  const messageRefreshTimeoutRef = useRef(null);
  const isFetchingMessagesRef = useRef(false);

  // --- Phase A: Presence ---
  const { onlineUsers } = usePresence(currentUser);

  const filteredUsers = useMemo(() => {
    const kw = userSearch.trim().toLowerCase();
    if (!kw) return availableUsers;
    return availableUsers.filter((u) => u.toLowerCase().includes(kw));
  }, [availableUsers, userSearch]);

  const scrollToBottom = () => { chatWindowRef.current?.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: 'auto' }); };

  const fetchMessages = useCallback(async () => {
    if (!currentUser || !activeUser || isFetchingMessagesRef.current) return;
    isFetchingMessagesRef.current = true;
    try {
      const fetched = await api.getMessages(currentUser, activeUser);
      if (Array.isArray(fetched)) {
        // --- Phase B: Anti-duplicate merge ---
        setMessages(prev => {
          // Keep any optimistic (temp) messages that haven't been confirmed yet
          const pendingTemps = prev.filter(m => m._tempId && m._status === 'sending');
          const serverIds = new Set(fetched.map(m => m.id));
          // Only keep temps whose real IDs haven't appeared in server data
          const remainingTemps = pendingTemps.filter(m => !serverIds.has(m._resolvedId));
          return [...fetched, ...remainingTemps];
        });
      }
    } catch (e) { console.error('Failed to fetch messages:', e); }
    finally { isFetchingMessagesRef.current = false; }
  }, [currentUser, activeUser]);

  const scheduleFetchMessages = useCallback(() => {
    if (messageRefreshTimeoutRef.current) return;
    messageRefreshTimeoutRef.current = setTimeout(() => { messageRefreshTimeoutRef.current = null; fetchMessages(); }, 250);
  }, [fetchMessages]);

  const sendTypingEvent = useCallback(async (isTyping) => {
    const ch = typingChannelRef.current;
    if (!ch || !currentUser || !activeUser) return;
    try { await ch.send({ type: 'broadcast', event: 'typing', payload: { from: currentUser, to: activeUser, isTyping, at: Date.now() } }); isTypingBroadcastedRef.current = isTyping; } catch {}
  }, [currentUser, activeUser]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const users = await api.getUsers(currentUser);
      if (!Array.isArray(users)) return;
      const userList = users.map((u) => u.username).filter(Boolean);
      setAvailableUsers(userList);
      setActiveUser((prev) => {
        if (initialActiveUser && userList.includes(initialActiveUser)) return initialActiveUser;
        if (prev && userList.includes(prev)) return prev;
        return userList[0] || '';
      });
    } catch (e) { console.error('Failed:', e); }
  }, [currentUser, initialActiveUser]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    fetchMessages();
    // Always set up a polling fallback for incoming messages
    const pollInterval = setInterval(() => { fetchMessages(); }, 3000);

    if (!supabase || !supabaseRealtimeEnabled || !currentUser) {
      // No Supabase — rely on polling only
      return () => clearInterval(pollInterval);
    }
    const ch = supabase.channel(`chat_messages_feed_${currentUser}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => scheduleFetchMessages())
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.from === activeUser && payload?.to === currentUser) setIsOtherUserTyping(Boolean(payload.isTyping));
      }).subscribe();
    typingChannelRef.current = ch;
    return () => { clearInterval(pollInterval); typingChannelRef.current = null; supabase.removeChannel(ch); };
  }, [currentUser, activeUser, fetchMessages, scheduleFetchMessages]);

  useEffect(() => {
    if (!activeUser) { setIsOtherUserTyping(false); return; }
    if (!newMessage.trim()) { if (isTypingBroadcastedRef.current) sendTypingEvent(false); return; }
    if (!isTypingBroadcastedRef.current) sendTypingEvent(true);
    if (typingBroadcastTimeoutRef.current) clearTimeout(typingBroadcastTimeoutRef.current);
    typingBroadcastTimeoutRef.current = setTimeout(() => sendTypingEvent(false), 1200);
    return () => { if (typingBroadcastTimeoutRef.current) clearTimeout(typingBroadcastTimeoutRef.current); };
  }, [newMessage, activeUser, sendTypingEvent]);

  useEffect(() => {
    return () => {
      if (typingBroadcastTimeoutRef.current) clearTimeout(typingBroadcastTimeoutRef.current);
      if (messageRefreshTimeoutRef.current) clearTimeout(messageRefreshTimeoutRef.current);
      if (isTypingBroadcastedRef.current) sendTypingEvent(false);
    };
  }, [sendTypingEvent]);
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { setIsOtherUserTyping(false); }, [activeUser]);
  useEffect(() => { if (refreshToken) scheduleFetchMessages(); }, [refreshToken, scheduleFetchMessages]);

  // --- Phase B: Optimistic Send ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeUser) return;

    const tempId = generateTempId();

    // 1. Optimistic: push immediately to local state
    const optimisticMsg = {
      _tempId: tempId,
      _status: 'sending', // 'sending' | 'sent' | 'failed'
      id: tempId,
      text,
      user: currentUser,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    if (isTypingBroadcastedRef.current) sendTypingEvent(false);

    // 2. Fire API call
    try {
      const r = await api.sendMessage(currentUser, activeUser, text);
      if (r.notification) showNotification(r.notification);

      // 3. Replace temp message with server response
      if (Array.isArray(r.messages)) {
        setMessages(prev => {
          // Remove the optimistic message, merge with server data
          const withoutTemp = prev.filter(m => m._tempId !== tempId);
          // Deduplicate: server messages take priority
          const serverIds = new Set(r.messages.map(m => m.id));
          const remainingTemps = withoutTemp.filter(m => m._tempId && !serverIds.has(m.id));
          return [...r.messages, ...remainingTemps];
        });
      } else {
        // Mark as sent even without full message list
        setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _status: 'sent' } : m));
        scheduleFetchMessages();
      }
    } catch (err) {
      // 4. On failure: mark message as failed with retry
      console.error('Failed to send message:', err);
      showNotification(`Error: ${err.message || 'Could not send message.'}`);
      setMessages(prev => prev.map(m =>
        m._tempId === tempId ? { ...m, _status: 'failed' } : m
      ));
    }
  };

  // Retry a failed message
  const handleRetry = async (tempId) => {
    const failedMsg = messages.find(m => m._tempId === tempId);
    if (!failedMsg) return;

    // Mark as sending
    setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _status: 'sending' } : m));

    try {
      const r = await api.sendMessage(currentUser, activeUser, failedMsg.text);
      if (r.notification) showNotification(r.notification);
      if (Array.isArray(r.messages)) {
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m._tempId !== tempId);
          return r.messages;
        });
      } else {
        setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _status: 'sent' } : m));
        scheduleFetchMessages();
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m._tempId === tempId ? { ...m, _status: 'failed' } : m));
      showNotification(`Retry failed: ${err.message}`);
    }
  };

  const openReportDialog = (msg) => { setReportTarget(msg); setReportReason('spam'); setReportDescription(''); };
  const closeReportDialog = () => { if (isSubmittingReport) return; setReportTarget(null); };
  const submitReport = async (e) => {
    e.preventDefault(); if (!reportTarget) return; setIsSubmittingReport(true);
    try { await api.reportMessage(currentUser, reportTarget.id, reportReason, reportDescription.trim() || null); showNotification('Message reported.'); closeReportDialog(); }
    catch (err) { showNotification(`Error: ${err.message}`); }
    finally { setIsSubmittingReport(false); }
  };
  const formatTime = (v) => { if (!v) return ''; try { return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

  if (!availableUsers.length) return <NoUsersView onClose={onClose} />;

  return (
    <>
      {/* Report Dialog */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sc-text/40 px-4 backdrop-blur-sm" onClick={closeReportDialog}>
          <div className="w-full max-w-md rounded-card bg-sc-container-floor p-8 elevation-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sc-text">Report message</h3>
              <button onClick={closeReportDialog} className="rounded-full p-1.5 text-sc-text-muted transition hover:bg-sc-container-high hover:text-sc-text border border-transparent hover:border-sc-outline/30"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 rounded-2xl bg-sc-container-low p-4 text-sm text-sc-text border border-sc-outline/20">
              <p className="text-xs uppercase tracking-wide text-sc-text-muted">Message preview</p>
              <p className="mt-2 leading-relaxed">{reportTarget.text}</p>
            </div>
            <form onSubmit={submitReport} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-sc-text">Reason</span>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-2xl bg-sc-container-high px-5 py-3 text-sm text-sc-text outline-none border border-sc-outline/30 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral">
                  <option value="spam">Spam or unsolicited</option><option value="harassment">Harassment or bullying</option><option value="hate">Hate speech</option><option value="scam">Scam or fraud</option><option value="other">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-sc-text">Additional details</span>
                <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} rows={4} placeholder="Optional context"
                  className="w-full resize-none rounded-2xl bg-sc-container-high px-5 py-3 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none border border-sc-outline/30 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral" />
              </label>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeReportDialog} className="rounded-full bg-sc-container-high px-5 py-2.5 text-sm font-medium text-sc-text-muted border border-sc-outline/30 transition hover:bg-sc-container-top" disabled={isSubmittingReport}>Cancel</button>
                <button type="submit" disabled={isSubmittingReport} className="rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all disabled:opacity-60">{isSubmittingReport ? 'Sending…' : 'Submit report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Chat Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center md:bg-sc-text/30 md:backdrop-blur-sm" onClick={onClose}>
        <div className="flex h-screen w-screen md:h-[85vh] md:w-[92vw] md:max-w-6xl overflow-hidden md:rounded-card bg-sc-container-floor elevation-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>

          {/* LEFT: Users */}
          <aside className={`flex shrink-0 flex-col bg-sc-container-low border-r border-sc-outline/25 ${activeUser ? "hidden md:flex md:w-72" : "flex w-full md:w-72"}`}>
            <div className="flex items-center justify-between px-5 py-5 border-b border-sc-outline/20">
              <h3 className="font-display text-base font-semibold tracking-tight text-sc-text">Chats</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-sc-text-muted transition hover:bg-sc-container-high hover:text-sc-text"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-muted" />
                <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search..."
                  className="w-full rounded-2xl bg-sc-container-high py-2.5 pl-9 pr-3 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none border border-sc-outline/25 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {filteredUsers.map((username) => {
                const isActive = activeUser === username;
                const isOnline = onlineUsers.has(username);
                return (
                  <button key={username} onClick={() => setActiveUser(username)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 border ${isActive ? 'bg-sc-secondary/40 border-sc-primary/15' : 'hover:bg-sc-container-high/50 border-transparent'}`}>
                    <div className="relative">
                      <img src={`https://i.pravatar.cc/150?u=${username}`} alt={username} className="h-10 w-10 rounded-full border border-sc-outline/20" />
                      <span className={`absolute -bottom-0.5 -right-0.5 ${isOnline ? 'animate-pulse-glow' : ''}`}>
                        <OnlineIndicator isOnline={isOnline} />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize text-sc-text">{username}</p>
                      <p className="truncate text-xs text-sc-text-muted">{isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-sc-primary animate-pulse-glow" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: Conversation */}
          <section className={`flex-1 min-w-0 flex-col bg-sc-container-floor ${activeUser ? "flex" : "hidden md:flex"}`}>
            <header className="flex items-center justify-between px-6 py-4 border-b border-sc-outline/20 bg-sc-container-low/40">
              <div className="flex items-center gap-3">
                {/* Back button — mobile only */}
                <button onClick={() => setActiveUser('')} className="md:hidden rounded-full p-1.5 text-sc-text-muted hover:bg-sc-container-high transition">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="relative">
                  <img src={`https://i.pravatar.cc/150?u=${activeUser}`} alt={activeUser} className="h-9 w-9 rounded-full border border-sc-outline/20" />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <OnlineIndicator isOnline={onlineUsers.has(activeUser)} />
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize text-sc-text">{activeUser}</p>
                  <p className="text-[11px] text-sc-text-muted">
                    {isOtherUserTyping
                      ? <span className="flex items-center gap-1 text-sc-primary">typing <TypingDots /></span>
                      : onlineUsers.has(activeUser) ? <span className="text-green-600">Online</span> : 'Offline'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sc-text-muted">
                <button className="rounded-full p-2 border border-transparent transition hover:bg-sc-container-high hover:text-sc-primary hover:border-sc-outline/20" title="Voice"><PhoneIcon className="h-5 w-5" /></button>
                <button className="rounded-full p-2 border border-transparent transition hover:bg-sc-container-high hover:text-sc-primary hover:border-sc-outline/20" title="Video"><VideoCameraIcon className="h-5 w-5" /></button>
                <button onClick={onClose} className="rounded-full p-2 border border-transparent transition hover:bg-sc-primary-light/20 hover:text-sc-primary" title="Close"><XMarkIcon className="h-5 w-5" /></button>
              </div>
            </header>

            {/* Messages */}
            <div ref={chatWindowRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {Array.isArray(messages) && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-sc-text-muted">No messages yet. Say hello! 👋</div>
              )}
              {Array.isArray(messages) && messages.map((msg, idx) => {
                const isMine = msg.user === currentUser;
                const isSending = msg._status === 'sending';
                const isFailed = msg._status === 'failed';
                return (
                  <div key={msg._tempId || msg.id || idx} className={`group flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}>
                    <div className="relative max-w-[65%]">
                      {/* Report button for received messages */}
                      {!isMine && !msg._tempId && (
                        <button type="button" onClick={() => openReportDialog(msg)}
                          className="absolute -right-2 -top-2 rounded-full bg-sc-container-floor px-2 py-1 text-[10px] font-medium text-sc-primary opacity-0 elevation-2 transition hover:bg-sc-primary-light/20 group-hover:opacity-100">
                          <span className="flex items-center gap-1"><FlagIcon className="h-3 w-3" />Report</span>
                        </button>
                      )}
                      <div className={[
                        'rounded-2xl px-4 py-2.5 text-sm border transition',
                        isMine ? 'bg-gradient-primary text-sc-on-primary rounded-br-md border-sc-primary/20' : 'bg-sc-container text-sc-text rounded-bl-md border-sc-outline/20',
                        isSending ? 'opacity-70' : '',
                        isFailed ? 'border-red-400/50' : '',
                        isMine && !isSending && !isFailed ? 'shadow-glow-coral' : '',
                      ].filter(Boolean).join(' ')}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${isMine ? 'text-sc-on-primary/60' : 'text-sc-text-muted'}`}>
                          {isSending && <span className="italic">Sending...</span>}
                          {isFailed && (
                            <button onClick={() => handleRetry(msg._tempId)} className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium">
                              <ArrowPathIcon className="h-3 w-3" /> Retry
                            </button>
                          )}
                          {!isSending && !isFailed && formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isOtherUserTyping && (
                <div className="flex justify-start">
                  <span className="rounded-2xl rounded-bl-md bg-sc-container px-4 py-2 text-xs text-sc-text-muted border border-sc-outline/20">typing<TypingDots /></span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 px-5 py-4 border-t border-sc-outline/20 bg-sc-container-low/30 mb-16 md:mb-0">
              <button type="button" className="rounded-full p-2 text-sc-text-muted border border-transparent hover:bg-sc-container-high hover:text-sc-primary hover:border-sc-outline/20 transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={!activeUser}
                className="flex-1 rounded-full bg-sc-container-high px-5 py-3 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none border border-sc-outline/25 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral disabled:opacity-40" />
              <button type="button" className="rounded-full p-2 text-sc-text-muted border border-transparent hover:bg-sc-container-high hover:text-sc-primary transition-all"><FaceSmileIcon className="h-5 w-5" /></button>
              <button type="submit" disabled={!activeUser || !newMessage.trim()}
                className="group grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sc-on-primary border border-sc-primary/20 shadow-glow-coral transition-all hover-scale disabled:opacity-30 disabled:shadow-none">
                <PaperAirplaneIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}