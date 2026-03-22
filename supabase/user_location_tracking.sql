-- Add location tracking and private cluster features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_location jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Add private circle features
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS cluster_number serial; -- Numeric ID for easier searching

-- Create an index for faster searching by cluster number
CREATE INDEX IF NOT EXISTS groups_cluster_number_idx ON public.groups (cluster_number);
