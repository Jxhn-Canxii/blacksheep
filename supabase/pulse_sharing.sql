-- Establish the Resonance Sharing protocol
-- This table tracks when a user synchronizes an existing vent into their own profile feed
CREATE TABLE IF NOT EXISTS public.pulse_shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vent_id uuid REFERENCES public.vents(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (user_id, vent_id)
);

-- Row Level Security for Pulse Shares
ALTER TABLE public.pulse_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pulse shares are viewable by everyone." ON public.pulse_shares
    FOR SELECT USING (true);

CREATE POLICY "Users can share vents." ON public.pulse_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their shares." ON public.pulse_shares
    FOR DELETE USING (auth.uid() = user_id);

-- Add 'shared' count to vents if not already present or handle via join
-- We will handle via join for maximum data integrity
