-- Create activities table for contact timeline
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo purposes (no auth yet)
CREATE POLICY "Allow public read access" 
ON public.activities 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.activities 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON public.activities 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access" 
ON public.activities 
FOR DELETE 
USING (true);

-- Enable realtime for activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;