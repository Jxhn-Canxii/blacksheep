-- Emotional Ledger: A historical archive of user emotional states
-- This table stores periodic check-ins requested by the Black Sheep Assistant.

CREATE TABLE IF NOT EXISTS public.emotional_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emotion text NOT NULL, -- The predicted or self-reported emotion
  intensity integer DEFAULT 5, -- 1-10 scale of how strong the feeling is
  note text, -- Optional user context for the check-in
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.emotional_ledger ENABLE ROW LEVEL SECURITY;

-- Users can only view their own ledger entries
CREATE POLICY "Users can view their own emotional ledger." ON public.emotional_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own ledger entries
CREATE POLICY "Users can insert their own emotional ledger." ON public.emotional_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ledger entries
CREATE POLICY "Users can delete their own emotional ledger." ON public.emotional_ledger
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster analysis queries
CREATE INDEX IF NOT EXISTS emotional_ledger_user_id_created_at_idx ON public.emotional_ledger (user_id, created_at DESC);
