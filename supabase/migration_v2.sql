-- ============================================================
-- MAMOVA — Migration v2: PIN-based shared profiles (no auth)
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Drop old auth-linked tables (they used user_id FK to auth.users)
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS profiles;

-- ── Profiles ─────────────────────────────────────────────────
-- No auth.users FK — identified by UUID stored on device.
-- PIN is the 6-digit share code for partner access.
CREATE TABLE profiles (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pin            text        NOT NULL,
  mother_name    text,
  partner_name   text,
  baby_name      text,
  delivery_date  date        NOT NULL,
  delivery_type  text        NOT NULL CHECK (delivery_type IN ('vaginal', 'c-section')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_pin_idx ON profiles (pin);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anon key can create, read, and update profiles.
-- PIN-based discovery is the access-control layer at the app level.
CREATE POLICY "anon_insert"  ON profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select"  ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update"  ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);
