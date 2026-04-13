-- ============================================================
-- REVIEWERS TABLE
-- Stores pediatric doctors, gynaecologists, and IBCLCs who
-- review breastfeeding and postpartum content before publish.
-- Phase 1b (Next.js + Supabase): run this migration first.
-- ============================================================

CREATE TABLE reviewers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  title          text        NOT NULL DEFAULT 'Dr.',
  -- credentials: e.g. ['MBBS', 'MD', 'IBCLC', 'DNB']
  credentials    text[]      NOT NULL DEFAULT '{}',
  -- specialization: 'Pediatrics' | 'Gynecology' | 'Lactation' | 'General Practice'
  specialization text        NOT NULL,
  hospital       text,
  city           text,
  active         boolean     NOT NULL DEFAULT true,
  added_at       timestamptz NOT NULL DEFAULT now()
);

-- Only active reviewers can be assigned to content
CREATE INDEX idx_reviewers_active ON reviewers (active) WHERE active = true;

-- RLS: reviewers list is readable by all authenticated users
-- (needed so the app can display reviewer details on content cards)
-- Write access is admin-only (enforced in Supabase dashboard role)
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active reviewers"
  ON reviewers FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- ── Seed data ──────────────────────────────────────────────
-- Replace placeholder values with real doctor details before
-- running this migration in production.
-- INSERT INTO reviewers (name, title, credentials, specialization, hospital, city)
-- VALUES
--   ('Dr. Priya Sharma',  'Dr.', ARRAY['MBBS','MD','IBCLC'],  'Pediatrics',      'Apollo Hospitals',  'Chennai'),
--   ('Dr. Anitha Rajan',  'Dr.', ARRAY['MBBS','DGO'],         'Gynecology',       'Fortis Healthcare', 'Bengaluru');
