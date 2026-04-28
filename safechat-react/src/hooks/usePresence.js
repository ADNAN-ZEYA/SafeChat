// src/hooks/usePresence.js
// Tracks online users via backend heartbeat polling.
// Sends POST /heartbeat every 10s, polls GET /online_users every 5s.
// Supabase Presence is used as enhancement if available.
// Gracefully degrades — always returns at least polling-based presence.

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseRealtimeEnabled } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * @param {string} currentUser - The currently logged-in username
 * @returns {{ onlineUsers: Set<string>, isConnected: boolean }}
 */
export default function usePresence(currentUser) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);

  // --- Backend heartbeat polling (always works) ---
  const sendHeartbeat = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch(`${API_BASE_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser }),
      });
    } catch (e) { /* network error — ignore */ }
  }, [currentUser]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/online_users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOnlineUsers(new Set(data));
          setIsConnected(true);
          return;
        }
      }
    } catch (e) { /* network error */ }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOnlineUsers(new Set());
      setIsConnected(false);
      return;
    }

    // Send heartbeat immediately, then every 10s
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);

    // Poll online users immediately, then every 5s
    fetchOnlineUsers();
    const pollInterval = setInterval(fetchOnlineUsers, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
    };
  }, [currentUser, sendHeartbeat, fetchOnlineUsers]);

  // --- Supabase Presence enhancement (optional, if available) ---
  useEffect(() => {
    if (!supabase || !supabaseRealtimeEnabled || !currentUser) return;

    try {
      const channel = supabase.channel('safechat_presence', {
        config: { presence: { key: currentUser } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users = new Set();
        for (const key of Object.keys(presenceState)) {
          users.add(key);
        }
        // Merge with polling-based presence
        setOnlineUsers(prev => {
          const merged = new Set([...prev, ...users]);
          return merged;
        });
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUser, online_at: new Date().toISOString() });
        }
      });

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    } catch (e) {
      // Supabase failed — backend polling is sufficient
      console.warn('Supabase Presence failed, using backend polling only:', e);
    }
  }, [currentUser]);

  return { onlineUsers, isConnected };
}
