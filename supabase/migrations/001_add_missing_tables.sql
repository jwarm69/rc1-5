-- ============================================================================
-- Migration: Add Missing Tables
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- 1. CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contact info
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  address text,

  -- CRM fields
  lead_source text,
  tags text[] DEFAULT '{}',
  deal_history text,
  pipeline_stage integer DEFAULT 0,
  last_contacted timestamptz,
  notes jsonb DEFAULT '[]',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted);

-- ============================================================================
-- 2. OPPORTUNITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contact reference (optional - can be standalone)
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name text NOT NULL,

  -- Deal info
  stage integer DEFAULT 0 CHECK (stage >= 0 AND stage <= 6),
  deal_value numeric,
  expected_close_date date,
  deal_type text CHECK (deal_type IN ('Buy', 'Sell')),
  source text,
  notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

-- ============================================================================
-- 3. CHAT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Message content
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,

  -- Coaching context
  coaching_mode text CHECK (coaching_mode IN ('CLARIFY', 'REFLECT', 'REFRAME', 'COMMIT', 'DIRECT')),

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- 4. ACTION ITEMS TABLE (FULL DEFINITION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Action details
  title text NOT NULL,
  description text,
  action_type text DEFAULT 'primary' CHECK (action_type IN ('primary', 'supporting')),
  category text CHECK (category IN ('contact', 'non_contact', 'admin', 'planning')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),

  -- Goal alignment
  minimum_viable text,
  stretch_goal text,
  milestone_connection text,

  -- Execution details
  minutes_estimate integer,
  steps text[] DEFAULT '{}',
  action_date date DEFAULT CURRENT_DATE,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- Completion tracking
  completed_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_date ON action_items(action_date);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own contacts" ON contacts;
CREATE POLICY "Users can CRUD own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own opportunities" ON opportunities;
CREATE POLICY "Users can CRUD own opportunities" ON opportunities
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own messages" ON chat_messages;
CREATE POLICY "Users can CRUD own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own actions" ON action_items;
CREATE POLICY "Users can CRUD own actions" ON action_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (run these after to confirm)
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('contacts', 'opportunities', 'chat_messages', 'action_items');
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
