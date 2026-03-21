-- Tighter RLS for Messages (only members of the group can read messages)
DROP POLICY IF EXISTS "Messages are viewable by everyone." ON messages;
CREATE POLICY "Group members can view messages in their group." ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = messages.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
    )
  );

-- Tighter RLS for Group Members (only members can see other members in their group)
DROP POLICY IF EXISTS "Group members are viewable by everyone." ON group_members;
CREATE POLICY "Group members can see other members in the same circle." ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
    )
  );

-- Tighten Avatar Storage
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Authenticated users can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar." ON storage.objects
  FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- Add Rate Limiting (this is a simple example using a trigger, but Supabase has other methods)
-- For now, let's just make sure we have robust RLS.

-- Protect Profiles: Only return necessary info in select
-- (This is already okay, but we can restrict update even more if needed)

-- Ensure only approved members can send messages
DROP POLICY IF EXISTS "Users can insert their own messages." ON messages;
CREATE POLICY "Approved group members can insert messages." ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = messages.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
    )
  );


