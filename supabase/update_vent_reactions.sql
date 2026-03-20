-- VENT REACTIONS SYSTEM: Like, Love, Haha, Wow, Sad, Angry

-- Create a table for vent reactions
create table vent_reactions (
  id uuid default gen_random_uuid() primary key,
  vent_id uuid references public.vents on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(vent_id, user_id) -- A user can only have one reaction per vent
);

-- Set up RLS for vent_reactions
alter table vent_reactions
  enable row level security;

create policy "Vent reactions are viewable by everyone." on vent_reactions
  for select using (true);

create policy "Users can react to vents." on vent_reactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reactions." on vent_reactions
  for update using (auth.uid() = user_id);

create policy "Users can remove their own reactions." on vent_reactions
  for delete using (auth.uid() = user_id);

-- Trigger for reaction notification
create function public.handle_new_reaction_notification() 
returns trigger as $$
declare
  vent_owner_id uuid;
begin
  select user_id into vent_owner_id from public.vents where id = new.vent_id;
  if vent_owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (vent_owner_id, new.user_id, 'reaction', new.vent_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Note: Ensure 'reaction' is added to the notification type check in notifications table if needed.
-- Since I previously defined notifications with: type text not null check (type in ('reply', 'follow', 'mention', 'message'))
-- I need to update the check constraint.

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in ('reply', 'follow', 'mention', 'message', 'reaction'));

create trigger on_reaction_created
  after insert on vent_reactions
  for each row execute procedure public.handle_new_reaction_notification();
