-- Comprehensive cleanup to bypass legacy constraints and unblock new signal archetypes
-- We utilize a programmatic sweep to drop any hidden check constraints on the notifications table
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.notifications'::regclass 
        AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

-- Now that legacy blocks are cleared, we establish our expanded type definitions
-- We also ensure the column is TEXT to allow for even more flexible future archetypes
ALTER TABLE public.notifications ALTER COLUMN type SET DATA TYPE text;

-- Add meta-layer for high-velocity signal propagation if missing
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Trigger to notify user when they create a circle
CREATE OR REPLACE FUNCTION public.handle_new_group_notification() 
RETURNS TRIGGER AS $$
BEGIN
  -- Propagate local cluster credentials directly into the creator's neural activity hub
  INSERT INTO public.notifications (user_id, actor_id, type, entity_id, metadata)
  VALUES (NEW.created_by, NEW.created_by, 'group_info', NEW.id, 
    jsonb_build_object('cluster_id', NEW.cluster_id, 'name', NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_group_created_notify ON public.groups;
CREATE TRIGGER tr_on_group_created_notify
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_group_notification();
