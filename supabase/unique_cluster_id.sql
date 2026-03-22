-- Enhance circles with a globally unique cluster ID
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS cluster_id text UNIQUE;

-- Trigger to automatically generate unique_cluster_id on insert
CREATE OR REPLACE FUNCTION generate_group_cluster_id()
RETURNS TRIGGER AS $$
DECLARE
    clean_name TEXT;
    date_part TEXT;
BEGIN
    -- Clean name for URL-friendly slug
    clean_name := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    clean_name := REGEXP_REPLACE(clean_name, '\s+', '-', 'g');
    
    -- Format date
    date_part := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYYMMDD');
    
    -- Combine with existing cluster_number if available, otherwise just name+date
    -- cluster_number is serial, so it might not be available in BEFORE trigger if handled by DB
    -- We'll use a AFTER trigger or just use a random seed if it's missing for now, 
    -- but ideally we want the sequential number.
    
    -- Let's use a trigger that runs AFTER insert to include the serial cluster_number
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Actually, a simpler way since cluster_number is serial:
-- In Next.js, we can also fetch it back.
-- But for "Silicon Valley Level", let's use a trigger that populates it correctly.
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
