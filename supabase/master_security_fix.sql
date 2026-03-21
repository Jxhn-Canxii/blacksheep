-- DROP ALL POLICIES on group_members and groups to start fresh
DROP POLICY IF EXISTS "Group members are viewable by everyone." ON group_members;
DROP POLICY IF EXISTS "Group members can see other members in the same circle." ON group_members;
DROP POLICY IF EXISTS "Group members can see members of groups they belong to." ON group_members;
DROP POLICY IF EXISTS "Group members are publicly viewable for listing purposes." ON group_members;
DROP POLICY IF EXISTS "Users can request to join a group." ON group_members;
DROP POLICY IF EXISTS "Users can leave a group." ON group_members;

DROP POLICY IF EXISTS "Groups are viewable by everyone." ON groups;
DROP POLICY IF EXISTS "Users can create their own groups." ON groups;
DROP POLICY IF EXISTS "Creators can update their own groups." ON groups;

-- Re-enable RLS just in case
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- NEW SAFE POLICIES (No recursion)

-- 1. Groups are public for listing
CREATE POLICY "Public Groups Visibility" ON groups
  FOR SELECT USING (true);

-- 2. Authenticated users can create groups
CREATE POLICY "Authenticated Users Create Groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- 3. Group members are public for listing (This fixes the 500 recursion error)
CREATE POLICY "Public Group Members Visibility" ON group_members
  FOR SELECT USING (true);

-- 4. Authenticated users can request to join
CREATE POLICY "Authenticated Users Join Groups" ON group_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 5. Members can leave
CREATE POLICY "Members Leave Groups" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Messages (Update existing policy to be safer)
DROP POLICY IF EXISTS "Group members can view messages in their group." ON messages;
DROP POLICY IF EXISTS "Messages are viewable by everyone." ON messages;

-- This is the only one that needs a join, but it's safe because group_members SELECT is true
CREATE POLICY "Messages visibility based on membership" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = messages.group_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

-- Ensure creators can manage their own groups
CREATE POLICY "Creators can manage groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by);
