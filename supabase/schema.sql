-- ============================================================
-- MAMOVA — Supabase Schema
-- Run in order: reviewers → profiles → bookmarks
-- ============================================================

-- ── Reviewers ────────────────────────────────────────────────
CREATE TABLE reviewers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  title          text        NOT NULL DEFAULT 'Dr.',
  credentials    text[]      NOT NULL DEFAULT '{}',
  specialization text        NOT NULL,
  hospital       text,
  city           text,
  active         boolean     NOT NULL DEFAULT true,
  added_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviewers_active ON reviewers (active) WHERE active = true;

ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read active reviewers"
  ON reviewers FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_name       text,
  delivery_date   date        NOT NULL,
  delivery_type   text        NOT NULL CHECK (delivery_type IN ('vaginal', 'c-section')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

-- ── Bookmarks ────────────────────────────────────────────────
CREATE TABLE bookmarks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type  text        NOT NULL CHECK (content_type IN ('symptom', 'position')),
  content_slug  text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_slug)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id);
