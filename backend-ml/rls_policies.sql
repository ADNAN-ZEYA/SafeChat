-- ============================================================
-- SafeChat Row Level Security (RLS) Policies
-- Apply this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ========================
-- 1. Enable RLS on tables
-- ========================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- ========================
-- 2. Chat Messages Policies
-- ========================

-- Users can read messages they sent or received
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  USING (
    sender_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
    OR receiver_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- Users cannot update or delete messages (immutable chat history)
-- If you want "edit message" later, create a separate policy

-- ========================
-- 3. User Profiles Policies
-- ========================

-- Everyone can read profiles (needed for contact discovery)
CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (
    user_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- Users can insert their own profile (first-time setup)
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- ========================
-- 4. Message Reports Policies
-- ========================

-- Users can insert reports (anyone can report)
CREATE POLICY "Users can create reports"
  ON message_reports FOR INSERT
  WITH CHECK (
    reporter_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- Users can only view their own reports
CREATE POLICY "Users can view own reports"
  ON message_reports FOR SELECT
  USING (
    reporter_id = (SELECT id FROM users WHERE username = current_setting('app.current_user', true))
  );

-- Admin override: allow the admin API (service role) to see all reports
-- Note: When using the Supabase service_role key in your FastAPI backend,
-- RLS is bypassed automatically. No extra policy needed for the admin panel.

-- ========================
-- 5. Realtime Replication
-- ========================
-- Enable in Supabase Dashboard → Database → Replication:
--   ✅ chat_messages: INSERT only
--   ✅ posts: INSERT, UPDATE
--   ❌ Do NOT enable UPDATE/DELETE on chat_messages unless you need "edited" features

-- ========================
-- 6. Indexes for Performance
-- ========================
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id);
