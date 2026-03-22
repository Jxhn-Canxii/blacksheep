-- Resonant Media Infrastructure: Audio & Visual Enrichment
-- Enhances vents with 'media_url' and 'media_type' for multisensory signals

-- 1. Extend 'vents' table with media support
ALTER TABLE public.vents ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.vents ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('video', 'audio', 'image'));

-- 2. Ensure RLS policies remain tight (select is already true, insert is already regulated by user_id)
-- Note: Developers must ensure storage buckets for 'vents_media' are created in Supabase Dashboard.

-- 3. Optimization: Index media for fast retrieval in high-density feeds
CREATE INDEX IF NOT EXISTS vents_media_type_idx ON public.vents (media_type) WHERE media_url IS NOT NULL;
