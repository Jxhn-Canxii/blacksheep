-- Enable Realtime for the messages table
-- This is required for the group chat to update instantly without refreshing
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add the messages table to the supabase_realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE messages, vents, replies, vent_reactions, reply_reactions;
COMMIT;
