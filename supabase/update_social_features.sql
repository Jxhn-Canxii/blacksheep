-- SOCIAL FEATURES UPDATE: Follows, Direct Messages, and Notifications

-- Create a table for follows (following and blocking)
create table follows (
  follower_id uuid references public.profiles on delete cascade not null,
  following_id uuid references public.profiles on delete cascade not null,
  status text default 'following' check (status in ('following', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Set up RLS for follows
alter table follows
  enable row level security;

create policy "Follows are viewable by everyone." on follows
  for select using (true);

create policy "Users can follow/block others." on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can update their follows/blocks." on follows
  for update using (auth.uid() = follower_id);

create policy "Users can unfollow others." on follows
  for delete using (auth.uid() = follower_id);

-- Create a table for direct messages
create table direct_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles on delete cascade not null,
  receiver_id uuid references public.profiles on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for direct_messages
alter table direct_messages
  enable row level security;

create policy "Users can view their own direct messages." on direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send direct messages." on direct_messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can update their own direct messages (e.g., mark as read)." on direct_messages
  for update using (auth.uid() = receiver_id);

-- Create a table for notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  actor_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('reply', 'follow', 'mention', 'message')),
  entity_id uuid, -- ID of the vent, reply, or message
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for notifications
alter table notifications
  enable row level security;

create policy "Users can view their own notifications." on notifications
  for select using (auth.uid() = user_id);

create policy "System/Users can insert notifications." on notifications
  for insert with check (true);

create policy "Users can update their own notifications." on notifications
  for update using (auth.uid() = user_id);

-- Trigger for new replies notification
create function public.handle_new_reply_notification() 
returns trigger as $$
declare
  vent_owner_id uuid;
begin
  select user_id into vent_owner_id from public.vents where id = new.vent_id;
  if vent_owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (vent_owner_id, new.user_id, 'reply', new.vent_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_reply_created
  after insert on replies
  for each row execute procedure public.handle_new_reply_notification();

-- Trigger for new follows notification
create function public.handle_new_follow_notification() 
returns trigger as $$
begin
  if new.status = 'following' then
    insert into public.notifications (user_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_follow_created
  after insert on follows
  for each row execute procedure public.handle_new_follow_notification();

-- Trigger for mentions in messages
create function public.handle_message_mentions() 
returns trigger as $$
declare
  mentioned_username text;
  mentioned_user_id uuid;
begin
  -- Simple regex to find @username
  for mentioned_username in 
    select unnest(regexp_matches(new.content, '@([a-zA-Z0-9_]+)', 'g'))
  loop
    select id into mentioned_user_id from public.profiles where username = mentioned_username;
    if mentioned_user_id is not null and mentioned_user_id != new.user_id then
      insert into public.notifications (user_id, actor_id, type, entity_id)
      values (mentioned_user_id, new.user_id, 'mention', new.id);
    end if;
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_created
  after insert on messages
  for each row execute procedure public.handle_message_mentions();
