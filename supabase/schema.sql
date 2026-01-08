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
-- 5. ENHANCED ACTION ITEMS
-- Add new columns to existing action_items table
-- ============================================================================

-- First check if action_items exists and add columns
DO $$
BEGIN
  -- Add action_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE action_items ADD COLUMN action_type text DEFAULT 'primary'
      CHECK (action_type IN ('primary', 'supporting'));
  END IF;

  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE action_items ADD COLUMN category text
      CHECK (category IN ('contact', 'non_contact', 'admin', 'planning'));
  END IF;

  -- Add minimum_viable column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'minimum_viable'
  ) THEN
    ALTER TABLE action_items ADD COLUMN minimum_viable text;
  END IF;

  -- Add stretch_goal column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'stretch_goal'
  ) THEN
    ALTER TABLE action_items ADD COLUMN stretch_goal text;
  END IF;

  -- Add milestone_connection column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'milestone_connection'
  ) THEN
    ALTER TABLE action_items ADD COLUMN milestone_connection text;
  END IF;

  -- Add minutes_estimate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'minutes_estimate'
  ) THEN
    ALTER TABLE action_items ADD COLUMN minutes_estimate integer;
  END IF;

  -- Add steps column (array of strings)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'steps'
  ) THEN
    ALTER TABLE action_items ADD COLUMN steps text[] DEFAULT '{}';
  END IF;

  -- Add action_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'action_date'
  ) THEN
    ALTER TABLE action_items ADD COLUMN action_date date DEFAULT CURRENT_DATE;
  END IF;

  -- Add priority column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_items' AND column_name = 'priority'
  ) THEN
    ALTER TABLE action_items ADD COLUMN priority text DEFAULT 'medium'
      CHECK (priority IN ('high', 'medium', 'low'));
  END IF;
END
$$;

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
-- 8. ROW LEVEL SECURITY
-- Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- 9. UPDATED_AT TRIGGERS
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

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this schema:
-- 1. Verify tables were created: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 2. Test RLS: Try to select from a table as a logged-in user
-- 3. Connect your app with the Supabase URL and anon key
-- ============================================================================
