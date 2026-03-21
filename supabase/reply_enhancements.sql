-- Add parent_reply_id to allow threaded replies
ALTER TABLE replies ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

-- Create reply_reactions table
CREATE TABLE IF NOT EXISTS reply_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reply_id UUID REFERENCES public.replies ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  UNIQUE (reply_id, user_id)
);

-- Set up RLS for reply_reactions
ALTER TABLE reply_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reply reactions are viewable by everyone." ON reply_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reply reactions." ON reply_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reply reactions." ON reply_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reply reactions." ON reply_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add rate limiting for reply reactions (optional, but good practice)
DROP TRIGGER IF EXISTS tr_check_reply_reaction_rate_limit ON reply_reactions;
CREATE TRIGGER tr_check_reply_reaction_rate_limit
BEFORE INSERT ON reply_reactions
FOR EACH ROW EXECUTE PROCEDURE check_reply_rate_limit();
