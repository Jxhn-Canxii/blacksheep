-- Performance Indexes for Group and Vent Queries
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

CREATE INDEX IF NOT EXISTS idx_vents_user_id ON vents(user_id);
CREATE INDEX IF NOT EXISTS idx_vents_created_at ON vents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replies_vent_id ON replies(vent_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id ON replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_reply_reactions_reply_id ON reply_reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_reactions_user_id ON reply_reactions(user_id);
