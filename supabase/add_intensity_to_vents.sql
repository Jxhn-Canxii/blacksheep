-- Add intensity column to vents table
ALTER TABLE public.vents 
ADD COLUMN IF NOT EXISTS intensity INTEGER DEFAULT 5;
