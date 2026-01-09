-- ============================================================================
-- RealCoach.ai - Database Schema
-- ============================================================================
-- Run this SQL in the Supabase SQL Editor to set up the database.
-- Make sure to run these in order as some tables depend on others.
-- ============================================================================

-- ============================================================================
-- 1. USER CALIBRATION STATE
-- Tracks user's progression through the calibration flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_calibration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  state text NOT NULL DEFAULT 'UNINITIALIZED'
    CHECK (state IN ('UNINITIALIZED', 'CALIBRATING', 'G&A_DRAFTED', 'G&A_CONFIRMED', 'ACTIONS_ACTIVE', 'RECALIBRATION_REQUIRED')),
  tone text CHECK (tone IN ('DIRECT_EXECUTIVE', 'COACH_CONCISE', 'NEUTRAL_MINIMAL')),
  fast_lane_triggered boolean DEFAULT false,
  current_question_index integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for quick lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_calibration_user_id ON user_calibration(user_id);

-- ============================================================================
-- 2. GOALS AND ACTIONS
-- Stores the user's confirmed Goals & Actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_goals_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Core goals
  annual_professional_goal text,
  annual_personal_goal text,
  current_reality text,
  monthly_milestone text,

  -- Execution preferences
  execution_style text CHECK (execution_style IN ('STRUCTURED', 'FLEXIBLE', 'SHORT_BURSTS', 'SLOW_CONSISTENT')),
  willingness_filter text[] DEFAULT '{}',
  friction_boundaries text[] DEFAULT '{}',

  -- Status tracking
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED')),
  confirmed_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_goals_actions_user_id ON user_goals_actions(user_id);

-- ============================================================================
-- 3. BUSINESS PLAN
-- Stores the user's business plan (optional, after G&A)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_business_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Business metrics
  revenue_target text,
  buyer_seller_split text,
  unit_target integer,
  average_commission numeric,

  -- Strategy
  primary_lead_source text,
  secondary_lead_sources text[] DEFAULT '{}',
  geographic_focus text,

  -- Risk and capacity
  risk_tolerance text CHECK (risk_tolerance IN ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE')),
  weekly_hours_available integer,

  -- Status
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED')),
  confirmed_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. CALIBRATION ANSWERS (AUDIT TRAIL)
-- Stores individual answers during calibration for reference
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  question_type text DEFAULT 'ga' CHECK (question_type IN ('ga', 'business_plan', 'fast_lane')),
  answer text NOT NULL,
  answered_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_calibration_answers_user_id ON calibration_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_calibration_answers_question_id ON calibration_answers(question_id);

-- ============================================================================
-- 5. ACTION ITEMS (LEGACY SECTION - NOW CREATED IN SECTION 11)
-- ============================================================================
-- NOTE: The action_items table is now created as a full table in section 11.
-- The old ALTER TABLE approach has been removed since it assumed the table
-- already existed, which caused errors on fresh installs.

-- ============================================================================
-- 6. COACHING SESSIONS
-- Track coaching interactions for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date date DEFAULT CURRENT_DATE,

  -- Coaching state
  mode text NOT NULL CHECK (mode IN ('CLARIFY', 'REFLECT', 'REFRAME', 'COMMIT', 'DIRECT')),
  move text CHECK (move IN ('FOCUS', 'AGENCY', 'IDENTITY', 'EASE', 'NONE')),

  -- Metrics
  questions_asked integer DEFAULT 0,
  policy_violations text[] DEFAULT '{}',

  -- Missed day handling
  missed_day_detected boolean DEFAULT false,
  missed_day_choice text CHECK (missed_day_choice IN ('UNPACK', 'SKIP')),

  -- Commitment tracking
  commitment text,
  commitment_completed boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON coaching_sessions(session_date);

-- ============================================================================
-- 7. DAILY CHECK-INS
-- Track daily check-in responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date date DEFAULT CURRENT_DATE,

  -- Check-in data
  raw_response text,
  completed_action_ids text[] DEFAULT '{}',
  partial_progress text,
  momentum_signal text CHECK (momentum_signal IN ('positive', 'neutral', 'negative')),
  friction_indicators text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- One check-in per user per day
  UNIQUE(user_id, checkin_date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(checkin_date);

-- ============================================================================
-- 8. CONTACTS
-- User's contact database for CRM functionality
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

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted);

-- ============================================================================
-- 9. OPPORTUNITIES (PIPELINE)
-- Tracks deals/opportunities in the sales pipeline
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

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

-- ============================================================================
-- 10. CHAT MESSAGES
-- Stores coach conversation history
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

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- 11. ACTION ITEMS (FULL TABLE)
-- Daily actions for users - replaces the ALTER TABLE approach
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

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_date ON action_items(action_date);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- ============================================================================
-- 12. ROW LEVEL SECURITY
-- Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user_calibration
DROP POLICY IF EXISTS "Users can view own calibration" ON user_calibration;
CREATE POLICY "Users can view own calibration" ON user_calibration
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_goals_actions
DROP POLICY IF EXISTS "Users can view own goals" ON user_goals_actions;
CREATE POLICY "Users can view own goals" ON user_goals_actions
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_business_plan
DROP POLICY IF EXISTS "Users can view own business plan" ON user_business_plan;
CREATE POLICY "Users can view own business plan" ON user_business_plan
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for calibration_answers
DROP POLICY IF EXISTS "Users can view own answers" ON calibration_answers;
CREATE POLICY "Users can view own answers" ON calibration_answers
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for coaching_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON coaching_sessions;
CREATE POLICY "Users can view own sessions" ON coaching_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for daily_checkins
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
CREATE POLICY "Users can view own checkins" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for contacts
DROP POLICY IF EXISTS "Users can CRUD own contacts" ON contacts;
CREATE POLICY "Users can CRUD own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for opportunities
DROP POLICY IF EXISTS "Users can CRUD own opportunities" ON opportunities;
CREATE POLICY "Users can CRUD own opportunities" ON opportunities
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for chat_messages
DROP POLICY IF EXISTS "Users can CRUD own messages" ON chat_messages;
CREATE POLICY "Users can CRUD own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for action_items
DROP POLICY IF EXISTS "Users can CRUD own actions" ON action_items;
CREATE POLICY "Users can CRUD own actions" ON action_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 13. UPDATED_AT TRIGGERS
-- Automatically update the updated_at timestamp
-- ============================================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_user_calibration_updated_at ON user_calibration;
CREATE TRIGGER update_user_calibration_updated_at
  BEFORE UPDATE ON user_calibration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_actions_updated_at ON user_goals_actions;
CREATE TRIGGER update_user_goals_actions_updated_at
  BEFORE UPDATE ON user_goals_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_business_plan_updated_at ON user_business_plan;
CREATE TRIGGER update_user_business_plan_updated_at
  BEFORE UPDATE ON user_business_plan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contacts
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for opportunities
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for action_items
DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this schema:
-- 1. Verify tables were created: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 2. Test RLS: Try to select from a table as a logged-in user
-- 3. Connect your app with the Supabase URL and anon key
-- ============================================================================
