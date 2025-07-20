-- Complete Supabase schema for social app

-- 1. Profiles table (create if not exists)
create table if not exists public.profiles (
  id uuid primary key,
  email text unique not null,
  username text unique not null,
  avatar_url text,
  password text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add password column if not exists (for backward compatibility)
alter table public.profiles add column if not exists password text;

-- Remove foreign key constraint if it exists
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- 2. Posts table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  title text not null,
  content text not null,
  image_urls text[] default '{}',
  tags text[] default '{}',
  upvotes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Votes table
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  value integer not null check (value in (-1, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Create indexes for better performance
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);
create index if not exists votes_user_id_idx on public.votes (user_id);
create index if not exists votes_post_id_idx on public.votes (post_id);

-- Create storage bucket for post images (if not exists)
insert into storage.buckets (id, name, public) 
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

drop policy if exists "Posts are viewable by everyone" on public.posts;
drop policy if exists "Users can create their own posts" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Users can delete their own posts" on public.posts;

drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Users can create their own comments" on public.comments;
drop policy if exists "Users can update their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

drop policy if exists "Votes are viewable by everyone" on public.votes;
drop policy if exists "Users can create their own votes" on public.votes;
drop policy if exists "Users can update their own votes" on public.votes;
drop policy if exists "Users can delete their own votes" on public.votes;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;

-- Create policies for profiles
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (true);

-- Create policies for posts
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Users can create their own posts" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" on public.posts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own posts" on public.posts
  for delete using (auth.uid() = user_id);

-- Create policies for comments
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Users can create their own comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own comments" on public.comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- Create policies for votes
create policy "Votes are viewable by everyone" on public.votes
  for select using (true);

create policy "Users can create their own votes" on public.votes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own votes" on public.votes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own votes" on public.votes
  for delete using (auth.uid() = user_id);

-- Storage policies for post images
create policy "Public Access" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "Authenticated users can upload" on storage.objects
  for insert with check (bucket_id = 'post-images' AND auth.role() = 'authenticated');

-- Additional fixes for database issues
-- Remove any potential triggers that might interfere with auth
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;
drop trigger if exists on_auth_user_deleted on auth.users;

-- Ensure the auth schema is properly set up
grant usage on schema auth to anon, authenticated;
grant all on auth.users to anon, authenticated; 