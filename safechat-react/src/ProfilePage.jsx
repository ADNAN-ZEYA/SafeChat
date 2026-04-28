import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { CameraIcon, CheckCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const api = {
  changeProfilePicture: async (userId, imageUrl, currentBio = '') => {
    const res = await fetch(`${API_BASE_URL}/update_profile/${encodeURIComponent(userId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: currentBio, profile_image_url: imageUrl }) });
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
  updateBio: async (userId, newBio, currentProfileImageUrl = null) => {
    const res = await fetch(`${API_BASE_URL}/update_profile/${encodeURIComponent(userId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: newBio, profile_image_url: currentProfileImageUrl }) });
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
  getProfile: async (userId) => {
    const res = await fetch(`${API_BASE_URL}/get_profile/${encodeURIComponent(userId)}`);
    const data = await res.json(); if (!res.ok) throw new Error(data?.detail || 'Failed'); return data;
  },
};

function Avatar({ url, username, size = 'lg' }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const sizeClasses = size === 'xl' ? 'h-28 w-28' : 'h-24 w-24';
  return (
    <div className={`relative ${sizeClasses}`}>
      {!imgLoaded && <div className="absolute inset-0 animate-shimmer rounded-full" />}
      <img src={url || `https://i.pravatar.cc/150?u=${username}`} alt={username} onLoad={() => setImgLoaded(true)}
        className={`relative z-10 h-full w-full rounded-full object-cover border-2 border-sc-primary/20 shadow-ambient-lg transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
      <span className="absolute right-0 bottom-1 z-20 h-4 w-4 rounded-full border-[3px] border-sc-surface bg-sc-primary shadow animate-pulse-glow" />
    </div>
  );
}

function FeedbackToast({ message, type, onDismiss }) {
  if (!message) return null;
  const color = type === 'error' ? 'bg-sc-primary-light/20 text-sc-primary border-sc-primary/20' : 'bg-sc-secondary/40 text-sc-on-secondary border-sc-secondary/40';
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm mt-3 border ${color} animate-fade-in-up`}>
      {type === 'success' && <CheckCircleIcon className="h-4 w-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100"><XMarkIcon className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function ProfilePage({ user, onNavigateToHome, onShowNotifications, onShowChat, onNavigateToFriends, onLogout, showNotification }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarInput, setAvatarInput] = useState('');
  const [changingAvatar, setChangingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState(null);
  const [bioInput, setBioInput] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bioFeedback, setBioFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try { const data = await api.getProfile(user); if (!cancelled) { setProfile(data); setBioInput(data.bio || ''); } }
      catch { if (!cancelled) { setProfile({ username: user, bio: '', profile_image_url: null }); setBioInput(''); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleChangePicture = async (e) => {
    e.preventDefault(); if (!avatarInput.trim()) return; setChangingAvatar(true); setAvatarFeedback(null);
    try { const result = await api.changeProfilePicture(user, avatarInput, profile?.bio || ''); setProfile((p) => p ? { ...p, profile_image_url: result.profile_image_url || avatarInput } : p); setAvatarFeedback({ message: 'Profile picture updated!', type: 'success' }); setAvatarInput(''); setTimeout(() => setAvatarFeedback(null), 3000); }
    catch (e) { setAvatarFeedback({ message: e.message || 'Could not change picture.', type: 'error' }); }
    finally { setChangingAvatar(false); }
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault(); setSavingBio(true); setBioFeedback(null);
    try { await api.updateBio(user, bioInput, profile?.profile_image_url || null); setProfile((p) => p ? { ...p, bio: bioInput } : p); setBioFeedback({ message: 'Bio updated!', type: 'success' }); setEditingBio(false); setTimeout(() => setBioFeedback(null), 3000); }
    catch (e) { setBioFeedback({ message: e.message || 'Could not update bio.', type: 'error' }); }
    finally { setSavingBio(false); }
  };

  return (
    <div className="relative min-h-screen bg-sc-surface text-sc-text">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 h-screen w-1/4">
          <Sidebar activePage="Profile" onShowNotifications={onShowNotifications} onShowChat={onShowChat} onNavigateToHome={onNavigateToHome} onNavigateToProfile={() => {}} onNavigateToFriends={onNavigateToFriends} />
          <div className="absolute bottom-4 left-0 w-full px-3">
            <button onClick={onLogout} className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-sc-text-muted transition-all hover:bg-sc-primary-light/15 hover:text-sc-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              <span>Logout <strong className="text-sc-text">{user}</strong></span>
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col bg-sc-container-low border-l border-sc-outline/20">
          <div className="px-8 pt-10 pb-2 animate-fade-in-up">
            <h2 className="font-display text-3xl font-bold tracking-tight text-sc-text">Your Profile</h2>
            <p className="mt-2 text-sm text-sc-text-muted">Manage your avatar and bio.</p>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="space-y-8 text-center">
                <div className="mx-auto h-28 w-28 rounded-full animate-shimmer" />
                <div className="mx-auto h-5 w-32 rounded-full animate-shimmer" />
                <div className="mx-auto h-4 w-48 rounded-full animate-shimmer" />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="mx-auto max-w-xl space-y-8">
                {/* Avatar */}
                <section className="rounded-card bg-sc-container p-8 elevation-2 animate-fade-in-up">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <Avatar url={profile?.profile_image_url} username={user} size="xl" />
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-display text-lg font-semibold capitalize text-sc-text">{user}</h3>
                      <p className="text-sm text-sc-text-muted">Username</p>
                      <form onSubmit={handleChangePicture} className="mt-5 flex flex-col gap-3">
                        <input type="text" value={avatarInput} onChange={(e) => setAvatarInput(e.target.value)} placeholder="Paste image URL…"
                          className="w-full rounded-2xl bg-sc-container-high px-5 py-3 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none border border-sc-outline/30 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral" />
                        <button type="submit" disabled={changingAvatar || !avatarInput.trim()}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-sc-secondary px-5 py-2.5 text-sm font-semibold text-sc-on-secondary hover-scale border border-sc-on-secondary/15 transition-all disabled:opacity-40">
                          <CameraIcon className="h-4 w-4" />{changingAvatar ? 'Saving…' : 'Update Picture'}
                        </button>
                      </form>
                      <FeedbackToast message={avatarFeedback?.message} type={avatarFeedback?.type} onDismiss={() => setAvatarFeedback(null)} />
                    </div>
                  </div>
                </section>

                {/* Bio */}
                <section className="rounded-card bg-sc-container p-8 elevation-2 animate-fade-in-up stagger-1">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-sc-text-muted">Bio</h3>
                    {!editingBio && (
                      <button onClick={() => setEditingBio(true)} className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-sc-primary border border-sc-primary/20 transition hover:bg-sc-secondary/30">
                        <PencilIcon className="h-3.5 w-3.5" />Edit
                      </button>
                    )}
                  </div>
                  {editingBio ? (
                    <form onSubmit={handleUpdateBio} className="space-y-4">
                      <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows={3} maxLength={200} placeholder="Tell others about yourself…"
                        className="w-full rounded-2xl bg-sc-container-high px-5 py-4 text-sm text-sc-text placeholder-sc-text-muted/50 outline-none resize-none border border-sc-outline/30 transition-all focus:bg-sc-container-floor focus:border-sc-primary/40 focus:shadow-glow-coral" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-sc-text-muted">{bioInput.length}/200</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setEditingBio(false); setBioInput(profile?.bio || ''); }}
                            className="rounded-full px-5 py-2.5 text-sm font-medium text-sc-text-muted border border-sc-outline/25 transition hover:bg-sc-container-high">Cancel</button>
                          <button type="submit" disabled={savingBio || bioInput === profile?.bio}
                            className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-sc-on-primary hover-scale border border-sc-primary/20 transition-all disabled:opacity-40">
                            {savingBio ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                      <FeedbackToast message={bioFeedback?.message} type={bioFeedback?.type} onDismiss={() => setBioFeedback(null)} />
                    </form>
                  ) : (
                    <div className="rounded-2xl bg-sc-container-low px-5 py-4 border border-sc-outline/15">
                      <p className="text-sm leading-relaxed text-sc-text">
                        {profile?.bio ? profile.bio : <span className="text-sc-text-muted italic">No bio yet. Click Edit to add one.</span>}
                      </p>
                    </div>
                  )}
                </section>

                {/* Stats */}
                <section className="grid grid-cols-3 gap-4 animate-fade-in-up stagger-2">
                  {[{ label: 'Messages', value: '—' }, { label: 'Friends', value: '—' }, { label: 'Status', value: 'Online' }].map((stat) => (
                    <div key={stat.label} className="rounded-card bg-sc-container px-5 py-6 text-center elevation-1 hover-lift">
                      <p className="font-display text-lg font-bold text-sc-text">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-sc-text-muted">{stat.label}</p>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
