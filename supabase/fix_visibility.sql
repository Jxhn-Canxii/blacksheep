-- Reset Groups RLS policies to ensure visibility
DROP POLICY IF EXISTS "Groups are viewable by everyone." ON groups;
CREATE POLICY "Groups are viewable by everyone." ON groups
  FOR SELECT USING (true);

-- Ensure group creators can manage their own groups
DROP POLICY IF EXISTS "Users can create their own groups." ON groups;
CREATE POLICY "Users can create their own groups." ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creators can update their own groups." ON groups;
CREATE POLICY "Creators can update their own groups." ON groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Ensure group members can join/leave
DROP POLICY IF EXISTS "Users can request to join a group." ON group_members;
CREATE POLICY "Users can request to join a group." ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure group members can see other members in a group
DROP POLICY IF EXISTS "Group members are viewable by everyone." ON group_members;
DROP POLICY IF EXISTS "Group members can see other members in the same circle." ON group_members;
DROP POLICY IF EXISTS "Group members can see members of groups they belong to." ON group_members;

CREATE POLICY "Group members are publicly viewable for listing purposes." ON group_members
  FOR SELECT USING (true);

-- Ensure group members can leave
DROP POLICY IF EXISTS "Users can leave a group." ON group_members;
CREATE POLICY "Users can leave a group." ON group_members
  FOR DELETE USING (auth.uid() = user_id);
