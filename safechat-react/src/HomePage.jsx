// src/HomePage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import ChatPanel from './ChatPanel';
import NotificationsPanel from './NotificationsPanel';
import HeartIcon from './icons/HeartIcon';
import CommentIcon from './icons/CommentIcon';
import ImageIcon from './icons/ImageIcon';
import Sidebar from './Sidebar';
import { TrashIcon } from '@heroicons/react/24/outline';
import { supabase, supabaseRealtimeEnabled } from './lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
    getPosts: () => fetch(`${API_BASE_URL}/get_posts`).then(res => res.json()),
    getUsers: (username) => fetch(`${API_BASE_URL}/get_users/${username}`).then(res => res.json()),
    getChatNotifications: (username, since) => {
      const query = since ? `?since=${encodeURIComponent(since)}` : '';
      return fetch(`${API_BASE_URL}/chat_notifications/${username}${query}`).then(res => res.json());
    },
    createPost: (user, text, parent_id = null) => fetch(`${API_BASE_URL}/create_post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, text, parent_id })
    }).then(res => res.json()),
    approvePost: (id) => fetch(`${API_BASE_URL}/approve_post/${id}`, { method: 'POST' }),
    blockPost: (id) => fetch(`${API_BASE_URL}/block_post/${id}`, { method: 'POST' }),
    deletePost: (id) => fetch(`${API_BASE_URL}/delete_post/${id}`, { method: 'POST' })
};

export default function HomePage({
  user, onLogout, showNotification, onNavigateToProfile, onNavigateToHome,
  onNavigateToFriends, onNavigateToAdmin, notifications, setNotifications,
  chatTargetUser, onChatTargetConsumed
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatRefreshToken, setChatRefreshToken] = useState(0);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const lastNotificationAtRef = useRef(new Date().toISOString());
  const seenMessageIdsRef = useRef(new Set());
  const [commentTexts, setCommentTexts] = useState({});

  const fetchPosts = useCallback(async () => {
    try { const fetchedPosts = await api.getPosts(); setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []); }
    catch (error) { console.error("Failed to fetch posts:", error); setPosts([]); }
  }, []);

  useEffect(() => {
    fetchPosts();
    const fetchUsers = async () => {
      try { const users = await api.getUsers(user); if (Array.isArray(users)) setRegisteredUsers(users); }
      catch (error) { console.error('Failed to fetch users:', error); }
    };
    const fetchIncomingMessages = async () => {
      try {
        const incoming = await api.getChatNotifications(user, lastNotificationAtRef.current);
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        incoming.forEach((note) => {
          if (seenMessageIdsRef.current.has(note.id)) return;
          seenMessageIdsRef.current.add(note.id);
          if (isChatOpen && chatTarget && note.from_user === chatTarget) { setChatRefreshToken((prev) => prev + 1); }
          else { showNotification(`New message: ${note.text}`, { type: 'message', user: note.from_user }); }
        });
        const lastIncoming = incoming[incoming.length - 1];
        if (lastIncoming?.created_at) lastNotificationAtRef.current = lastIncoming.created_at;
      } catch (error) { console.error('Failed to fetch incoming message notifications:', error); }
    };
    fetchUsers(); fetchIncomingMessages();
    const notificationInterval = setInterval(fetchIncomingMessages, 4000);
    if (!supabase || !supabaseRealtimeEnabled) return () => clearInterval(notificationInterval);
    const channel = supabase.channel(`home_updates_${user}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => fetchIncomingMessages())
      .subscribe();
    return () => { clearInterval(notificationInterval); supabase.removeChannel(channel); };
  }, [fetchPosts, user, showNotification, isChatOpen, chatTarget]);

  useEffect(() => {
    if (!chatTargetUser) return;
    setChatTarget(chatTargetUser); setIsChatOpen(true);
    if (onChatTargetConsumed) onChatTargetConsumed();
  }, [chatTargetUser, onChatTargetConsumed]);

  const handleLike = (postId, postUser) => {
    setNotifications(prev => [{ id: Date.now(), type: 'like', text: `${user} liked ${postUser}'s post.` }, ...prev]);
  };
  const handleImageSelect = (event) => { const file = event.target.files[0]; if (file) setSelectedImage(URL.createObjectURL(file)); };
  const handleCreatePost = async () => {
    if (!newPostText.trim()) { alert("Please add some text to your post."); return; }
    try { const response = await api.createPost(user, newPostText); if (response.notification) showNotification(response.notification); setNewPostText(""); setSelectedImage(null); fetchPosts(); }
    catch { showNotification("Error: Could not create post."); }
  };
  const handleAddComment = async (postId, commentText) => {
    if (!commentText || !commentText.trim()) return;
    try { const response = await api.createPost(user, commentText, postId); if (response.notification) showNotification(response.notification); setCommentTexts(prev => ({ ...prev, [postId]: '' })); fetchPosts(); }
    catch { showNotification("Error: Could not post comment."); }
  };
  const handleApprove = async (postId) => { await api.approvePost(postId); fetchPosts(); };
  const handleBlock = async (postId) => { await api.blockPost(postId); fetchPosts(); };
  const handleDelete = async (postId) => { try { await api.deletePost(postId); fetchPosts(); } catch { showNotification("Error: Could not delete post."); } };

  return (
    <div className="relative min-h-screen text-sc-text bg-sc-surface">
      <div className="mx-auto flex max-w-7xl">
        {/* LEFT: Navigation */}
        <aside className="sticky top-0 h-screen w-1/4">
          <Sidebar onShowNotifications={() => setIsNotificationsOpen(true)} onShowChat={() => setIsChatOpen(true)}
            onNavigateToHome={onNavigateToHome} onNavigateToProfile={onNavigateToProfile}
            onNavigateToFriends={onNavigateToFriends} onNavigateToAdmin={onNavigateToAdmin} />
          <div className="absolute bottom-4 p-4">
            <button onClick={onLogout} className="flex items-center gap-4 rounded-full p-3 text-base text-sc-text-muted transition-all hover:bg-sc-container-high hover:text-sc-primary">
              <span>Logout <strong className="text-sc-text">{user}</strong></span>
            </button>
          </div>
        </aside>

        {/* MIDDLE: Feed */}
        <main className="w-1/2 min-h-screen bg-sc-container-low border-x border-sc-outline/20">
          <div className="p-8">
            {/* Welcome */}
            <div className="mb-8 rounded-card bg-sc-container p-8 elevation-1 animate-fade-in-up">
              <h2 className="font-display text-3xl font-bold text-sc-text">Welcome, {user}</h2>
              <p className="text-sc-text-muted mt-2">Share updates, reply to comments, and stay connected in real time.</p>
            </div>

            {/* Create Post */}
            <section className="mb-10 rounded-card bg-sc-container p-8 elevation-2 animate-fade-in-up stagger-1">
              <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)}
                placeholder={`What's on your mind, ${user}?`}
                className="w-full resize-none bg-transparent p-3 text-lg text-sc-text placeholder-sc-text-muted/50 focus:outline-none" />
              {selectedImage && (
                <div className="mt-4 relative">
                  <img src={selectedImage} alt="Preview" className="w-full rounded-card border border-sc-outline/20" />
                  <button onClick={() => setSelectedImage(null)}
                    className="absolute top-3 right-3 bg-sc-surface/90 backdrop-blur-sm text-sc-text rounded-full h-8 w-8 flex items-center justify-center text-sm border border-sc-outline/30 shadow-ambient hover:bg-sc-container-high transition-all">✕</button>
                </div>
              )}
              <div className="mt-4 h-px w-full bg-sc-outline/20" />
              <div className="mt-4 flex items-center justify-between">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                <button onClick={() => fileInputRef.current.click()}
                  className="rounded-full p-2.5 text-sc-text-muted hover:text-sc-primary hover:bg-sc-secondary/30 transition-all duration-200 border border-transparent hover:border-sc-primary/15">
                  <ImageIcon />
                </button>
                <button onClick={handleCreatePost}
                  className="rounded-full bg-gradient-primary px-7 py-2.5 font-bold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all duration-200">
                  Post
                </button>
              </div>
            </section>

            {/* Feed */}
            <section>
              <h2 className="mb-6 font-display text-xl font-semibold text-sc-text">Feed</h2>
              <div className="space-y-6">
                {Array.isArray(posts) && posts.filter(post => post.status !== 'blocked').map((post, idx) => (
                  <div key={post.id}
                    className={`rounded-card overflow-hidden hover-lift animate-fade-in-up ${post.status === 'pending' ? 'bg-sc-tertiary/10 border border-sc-tertiary/30' : 'bg-sc-container elevation-1'}`}
                    style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="p-7">
                      <div className="mb-4 flex justify-between text-sm text-sc-text-muted">
                        <span className="font-bold text-sc-primary capitalize">{post.username}</span>
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mb-4 text-sc-text leading-relaxed">{post.text}</p>

                      {post.status === 'pending' && (
                        <div className="flex items-center gap-4 rounded-2xl bg-sc-tertiary/20 border border-sc-tertiary/30 p-4 mt-4">
                          <p className="text-sm font-semibold text-sc-on-tertiary">⚠️ Pending approval.</p>
                          <button onClick={() => handleApprove(post.id)} className="ml-auto rounded-full bg-gradient-primary px-4 py-1.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20">Approve</button>
                          <button onClick={() => handleBlock(post.id)} className="rounded-full bg-sc-container-top px-4 py-1.5 text-sm font-semibold text-sc-text-muted border border-sc-outline/30 hover:bg-sc-surface-dim transition-all">Block</button>
                        </div>
                      )}

                      <div className="flex gap-6 pt-5 mt-5 border-t border-sc-outline/15 text-sc-text-muted">
                        <button onClick={() => handleLike(post.id, post.username)} className="flex items-center gap-2 transition-all hover:text-sc-primary-light hover:scale-110">
                          <HeartIcon /> {post.likes || 0}
                        </button>
                        <button className="flex items-center gap-2 transition-all hover:text-sc-primary hover:scale-110">
                          <CommentIcon /> {post.comments?.length || 0}
                        </button>
                        {post.username === user && (
                          <button onClick={() => handleDelete(post.id)} className="flex items-center gap-2 ml-auto text-sc-text-muted/60 transition-all hover:text-sc-primary hover:scale-110">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      {/* Comments */}
                      <div className="space-y-3 pt-5 mt-3">
                        {Array.isArray(post.comments) && post.comments.filter(c => c.status !== 'blocked').map((comment) => (
                          <div key={comment.id} className="text-sm pl-4 border-l-2 border-sc-primary/20">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="mr-2 font-semibold capitalize text-sc-primary">{comment.username}</span>
                                <span className="text-sc-text">{comment.text}</span>
                              </div>
                              {comment.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-sc-on-tertiary bg-sc-tertiary/30 px-2 py-0.5 rounded-full border border-sc-tertiary/30">(pending)</span>
                                  <button onClick={() => handleApprove(comment.id)} className="rounded-full bg-gradient-primary px-3 py-0.5 text-xs text-sc-on-primary hover-scale">Approve</button>
                                  <button onClick={() => handleBlock(comment.id)} className="rounded-full bg-sc-container-top px-3 py-0.5 text-xs text-sc-text-muted border border-sc-outline/30">Block</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment Form */}
                      <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id, commentTexts[post.id] || ''); }}
                        className="flex items-center gap-3 pt-5 mt-3">
                        <input type="text" placeholder="Add a comment..."
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="w-full rounded-full bg-sc-container-high px-5 py-2.5 text-sm text-sc-text placeholder-sc-text-muted/50 border border-sc-outline/25 focus:outline-none focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral transition-all duration-200" />
                        <button type="submit" className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all">Post</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* RIGHT: Widgets */}
        <aside className="sticky top-0 h-screen w-1/4 p-6 bg-sc-surface">
          <div className="rounded-card bg-sc-container-low elevation-1 p-5 animate-fade-in-up stagger-2">
            <h3 className="mb-5 font-display text-lg font-bold text-sc-text">Registered Users</h3>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {registeredUsers.length === 0 ? (
                <p className="text-sm text-sc-text-muted">No users found yet.</p>
              ) : registeredUsers.map((item) => (
                <div key={item.username} className="flex items-center justify-between p-2 rounded-2xl hover:bg-sc-container/60 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/150?u=${item.username}`} alt={item.username} className="h-10 w-10 rounded-full border border-sc-outline/20" />
                    <span className="font-semibold text-sc-text capitalize">{item.username}</span>
                  </div>
                  <button onClick={() => { setChatTarget(item.username); setChatRefreshToken((prev) => prev + 1); setIsChatOpen(true); }}
                    className="rounded-full bg-sc-secondary px-4 py-1.5 text-sm font-semibold text-sc-on-secondary hover-scale border border-sc-on-secondary/15 transition-all duration-200">Chat</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} currentUser={user} showNotification={showNotification} initialActiveUser={chatTarget} refreshToken={chatRefreshToken} />}
      {isNotificationsOpen && <NotificationsPanel onClose={() => setIsNotificationsOpen(false)} notifications={notifications} />}
    </div>
  );
}