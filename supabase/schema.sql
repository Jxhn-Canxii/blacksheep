-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for vents
create table vents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  user_id uuid references public.profiles on delete cascade not null,
  emotion text,
  location jsonb
);

-- Set up Row Level Security (RLS) for vents
alter table vents
  enable row level security;

create policy "Vents are viewable by everyone." on vents
  for select using (true);

create policy "Users can insert their own vents." on vents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own vents." on vents
  for update using (auth.uid() = user_id);

create policy "Users can delete their own vents." on vents
  for delete using (auth.uid() = user_id);

-- Create a table for replies to vents
create table replies (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  user_id uuid references public.profiles on delete cascade not null,
  vent_id uuid references public.vents on delete cascade not null
);

-- Set up Row Level Security (RLS) for replies
alter table replies
  enable row level security;

create policy "Replies are viewable by everyone." on replies
  for select using (true);

create policy "Users can insert their own replies." on replies
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own replies." on replies
  for update using (auth.uid() = user_id);

create policy "Users can delete their own replies." on replies
  for delete using (auth.uid() = user_id);

-- Create a table for groups
create table groups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  created_by uuid references public.profiles on delete cascade not null
);

-- Set up Row Level Security (RLS) for groups
alter table groups
  enable row level security;

create policy "Groups are viewable by everyone." on groups
  for select using (true);

create policy "Users can insert their own groups." on groups
  for insert with check (auth.uid() = created_by);

create policy "Group creators can update their own groups." on groups
  for update using (auth.uid() = created_by);

create policy "Group creators can delete their own groups." on groups
  for delete using (auth.uid() = created_by);

-- Automatically add group creator as an approved admin member
create function public.handle_group_creator_as_admin() 
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, status, role)
  values (new.id, new.created_by, 'approved', 'admin');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_group_created
  after insert on groups
  for each row execute procedure public.handle_group_creator_as_admin();

-- Create a table for global chat messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  user_id uuid references public.profiles on delete cascade not null,
  group_id uuid references public.groups on delete cascade
);

-- Set up Row Level Security (RLS) for messages
alter table messages
  enable row level security;

create policy "Messages are viewable by everyone." on messages
  for select using (true);

create policy "Users can insert their own messages." on messages
  for insert with check (auth.uid() = user_id);

-- Create a table for group members
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved')),
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  unique (group_id, user_id)
);

-- Set up Row Level Security (RLS) for group_members
alter table group_members
  enable row level security;

create policy "Group members are viewable by everyone." on group_members
  for select using (true);

create policy "Users can insert themselves into a group." on group_members
  for insert with check (auth.uid() = user_id);

create policy "Users can remove themselves from a group." on group_members
  for delete using (auth.uid() = user_id);

-- Admins and moderators can approve members and update roles
create policy "Admins and moderators can update group members." on group_members
  for update using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('admin', 'moderator')
      and gm.status = 'approved'
    )
  );

-- Admins and moderators can remove members from the circle
create policy "Admins and moderators can delete group members." on group_members
  for delete using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('admin', 'moderator')
      and gm.status = 'approved'
    )
  );

-- Set up Storage for avatars
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

-- Allow public access to avatars
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

-- Allow authenticated users to upload an avatar
create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

-- Allow users to update their own avatar
create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner) with check (bucket_id = 'avatars');
