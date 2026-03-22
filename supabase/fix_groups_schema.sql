-- Circle Infrastructure Repair: Ensuring Schema Integrity
-- Fixes "Internal Server Error" caused by missing columns in the Groups discovery hub

-- 1. Ensure 'is_private' flag exists for exclusivity controls
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 2. Ensure 'cluster_number' exists for unique sequential designation
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS cluster_number SERIAL;

-- 3. Ensure 'cluster_id' exists for global signature resonance
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS cluster_id TEXT UNIQUE;

-- 4. Re-establish the Population Trigger (Maintenance)
CREATE OR REPLACE FUNCTION populate_group_cluster_id()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.groups 
    SET cluster_id = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')) 
                    || '-' || TO_CHAR(created_at, 'YYYYMMDD') 
                    || '-' || cluster_number
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_populate_cluster_id ON public.groups;
CREATE TRIGGER tr_populate_cluster_id
AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE PROCEDURE populate_group_cluster_id();

-- 5. Backfill existing groups (Self-Healing)
UPDATE public.groups 
SET cluster_id = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')) 
                || '-' || TO_CHAR(created_at, 'YYYYMMDD') 
                || '-' || cluster_number
WHERE cluster_id IS NULL;
