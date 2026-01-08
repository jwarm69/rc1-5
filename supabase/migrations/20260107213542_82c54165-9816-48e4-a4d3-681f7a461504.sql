-- Add user_id to all tables for per-user data
ALTER TABLE public.opportunities ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.meetings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.action_items ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create chat_messages table for persistent chat history
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  action_type text
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.opportunities;
DROP POLICY IF EXISTS "Allow public insert access" ON public.opportunities;
DROP POLICY IF EXISTS "Allow public update access" ON public.opportunities;
DROP POLICY IF EXISTS "Allow public delete access" ON public.opportunities;

DROP POLICY IF EXISTS "Allow public read access" ON public.notes;
DROP POLICY IF EXISTS "Allow public insert access" ON public.notes;
DROP POLICY IF EXISTS "Allow public update access" ON public.notes;
DROP POLICY IF EXISTS "Allow public delete access" ON public.notes;

DROP POLICY IF EXISTS "Allow public read access" ON public.meetings;
DROP POLICY IF EXISTS "Allow public insert access" ON public.meetings;
DROP POLICY IF EXISTS "Allow public update access" ON public.meetings;
DROP POLICY IF EXISTS "Allow public delete access" ON public.meetings;

DROP POLICY IF EXISTS "Allow public read access" ON public.action_items;
DROP POLICY IF EXISTS "Allow public insert access" ON public.action_items;
DROP POLICY IF EXISTS "Allow public update access" ON public.action_items;
DROP POLICY IF EXISTS "Allow public delete access" ON public.action_items;

-- Create user-scoped policies for opportunities
CREATE POLICY "Users can view own opportunities" ON public.opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = user_id);

-- Create user-scoped policies for notes
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Create user-scoped policies for meetings
CREATE POLICY "Users can view own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);

-- Create user-scoped policies for action_items
CREATE POLICY "Users can view own action_items" ON public.action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action_items" ON public.action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action_items" ON public.action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action_items" ON public.action_items FOR DELETE USING (auth.uid() = user_id);

-- Create user-scoped policies for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);