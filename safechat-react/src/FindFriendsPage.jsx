import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import { MagnifyingGlassIcon, UserGroupIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import usePresence from './hooks/usePresence';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
  getUsers: async (username) => {
    const res = await fetch(`${API_BASE_URL}/get_users/${username}`);
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
};

function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-card p-5 elevation-1">
      <div className="h-12 w-12 shrink-0 rounded-full animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded-full animate-shimmer" />
        <div className="h-3 w-16 rounded-full animate-shimmer" />
      </div>
      <div className="h-9 w-24 rounded-full animate-shimmer" />
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="mb-4 rounded-full bg-sc-secondary/30 p-6 border border-sc-secondary/40 animate-float">
        <UserGroupIcon className="h-12 w-12 text-sc-primary/40" />
      </div>
      <p className="font-display text-lg font-semibold text-sc-text">
        {query ? 'No one matches your search' : 'No registered users yet'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-sc-text-muted">
        {query ? `No users found for "${query}". Try a different name.` : 'When more people join SafeChat they\'ll appear here.'}
      </p>
    </div>
  );
}

export default function FindFriendsPage({ user, onLogout, onNavigateToHome, onNavigateToProfile, onNavigateToFriends, onStartChat, showNotification }) {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Phase A: Presence ---
  const { onlineUsers } = usePresence(user);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const list = await api.getUsers(user); setUsers(Array.isArray(list) ? list : []); }
      catch (error) { console.error('Failed:', error); showNotification('Could not load registered users.'); }
      finally { setLoading(false); }
    })();
  }, [user, showNotification]);

  const filteredUsers = useMemo(() => { const q = searchText.trim().toLowerCase(); if (!q) return users; return users.filter((item) => item.username?.toLowerCase().includes(q)); }, [searchText, users]);
  const query = searchText.trim();

  return (
    <div className="relative min-h-screen text-sc-text bg-sc-surface">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 h-screen w-1/4">
          <Sidebar activePage="Find Friends"
            onShowNotifications={() => showNotification('Open Notifications from Home page.')}
            onShowChat={() => showNotification('Open Messages from Home page.')}
            onNavigateToHome={onNavigateToHome} onNavigateToProfile={onNavigateToProfile} onNavigateToFriends={onNavigateToFriends} />
          <div className="absolute bottom-4 left-0 w-full px-3">
            <button onClick={onLogout} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-sc-text-muted transition-all hover:bg-sc-primary-light/15 hover:text-sc-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              <span>Logout <strong className="text-sc-text">{user}</strong></span>
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col bg-sc-container-low border-l border-sc-outline/20">
          <div className="px-8 pt-10 pb-4 animate-fade-in-up">
            <h2 className="font-display text-3xl font-bold tracking-tight text-sc-text">Find Friends</h2>
            <p className="mt-2 text-sm text-sc-text-muted">Browse registered users and start chatting instantly.</p>
          </div>
          <div className="px-8 pb-6 animate-fade-in-up stagger-1">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-muted" />
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search by username…"
                className="w-full rounded-2xl bg-sc-container-high py-3.5 pl-11 pr-4 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none border border-sc-outline/30 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-2">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <UserCardSkeleton key={i} />)}</div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredUsers.map((item, idx) => (
                  <div key={item.username}
                    className="group flex items-center gap-4 rounded-card bg-sc-container p-5 elevation-1 hover-lift animate-fade-in-up"
                    style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="relative">
                      <img src={`https://i.pravatar.cc/150?u=${item.username}`} alt={item.username}
                        className="h-12 w-12 rounded-full border border-sc-outline/25 transition-transform duration-200 group-hover:scale-105" />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sc-container ${onlineUsers.has(item.username) ? 'bg-green-500' : 'bg-sc-text-muted/40'}`}
                        style={onlineUsers.has(item.username) ? { boxShadow: '0 0 6px rgba(34,197,94,0.4)' } : {}} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold capitalize text-sc-text">{item.username}</p>
                      <p className={`text-xs ${onlineUsers.has(item.username) ? 'text-green-600' : 'text-sc-text-muted'}`}>{onlineUsers.has(item.username) ? 'Online' : 'Offline'}</p>
                    </div>
                    <button onClick={() => onStartChat(item.username)}
                      className="shrink-0 rounded-full bg-sc-secondary px-5 py-2 text-xs font-semibold text-sc-on-secondary hover-scale border border-sc-on-secondary/15 transition-all">
                      <span className="flex items-center gap-1.5"><ArrowsRightLeftIcon className="h-3.5 w-3.5" />Message</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
