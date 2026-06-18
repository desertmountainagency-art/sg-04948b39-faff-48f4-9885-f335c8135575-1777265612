-- ============================================================
-- profiles
-- One row per auth.users entry. Auto-created on sign-up.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  avatar_url    TEXT,
  plan          TEXT NOT NULL DEFAULT 'starter'
                  CHECK (plan IN ('starter', 'pro', 'enterprise')),
  scan_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Automatically provision a profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ============================================================
-- projects
-- A saved project / repo a user wants to repeatedly scan.
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  repository_url  TEXT NOT NULL,
  platform        TEXT CHECK (
                    platform IN ('github','lovable','replit','bolt','cursor','v0','other')
                  ),
  description     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_projects_updated_at ON projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_projects_user_id  ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);

-- ============================================================
-- scans
-- Each individual security audit run.
-- project_id is nullable: one-off scans need no saved project.
-- ============================================================
CREATE TABLE IF NOT EXISTS scans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  target_url      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','completed','failed')),
  audit_id        TEXT UNIQUE,
  critical_count  INTEGER NOT NULL DEFAULT 0,
  warning_count   INTEGER NOT NULL DEFAULT 0,
  passed_count    INTEGER NOT NULL DEFAULT 0,
  findings        JSONB NOT NULL DEFAULT '[]',
  error_message   TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at    TIMESTAMP WITH TIME ZONE
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_scans" ON scans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_scans" ON scans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_scans" ON scans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_scans" ON scans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scans_user_id    ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_scans_status     ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_audit_id   ON scans(audit_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- ============================================================
-- subscriptions — add missing INSERT / UPDATE / DELETE policies
-- (SELECT policy already exists from the first migration.)
-- The service-role key (used by Stripe webhooks) bypasses RLS,
-- so these policies only need to cover user-initiated reads.
-- We add UPDATE so users can read cancel_at_period_end changes
-- that were applied server-side; direct user mutations stay
-- restricted to service-role only.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'subscriptions'
      AND policyname = 'update_own_subscriptions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
        TO authenticated
        USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
        WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
    $policy$;
  END IF;
END;
$$;
