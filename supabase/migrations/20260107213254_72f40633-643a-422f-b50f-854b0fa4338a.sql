-- Table for opportunities
CREATE TABLE public.opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  contact_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  deal_amount numeric,
  notes text
);

-- Table for notes
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  contact_name text,
  content text NOT NULL
);

-- Table for scheduled meetings
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  contact_name text,
  meeting_date date NOT NULL,
  meeting_time text,
  location text,
  notes text
);

-- Table for action items
CREATE TABLE public.action_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  contact_name text,
  action_text text NOT NULL,
  completed boolean NOT NULL DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Public access policies (for demo mode without auth)
CREATE POLICY "Allow public read access" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.opportunities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.opportunities FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.notes FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.meetings FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.action_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.action_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.action_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.action_items FOR DELETE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to opportunities
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();