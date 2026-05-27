-- Supabase schema for Inkflow blogging platform
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  twitter_url text,
  github_url text,
  role text not null default 'reader' check (role in ('admin', 'writer', 'reader')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  excerpt text,
  markdown text not null,
  cover_image text,
  published boolean not null default false,
  published_at timestamptz,
  tags text[] not null default '{}',
  views integer not null default 0,
  likes integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_posts_author on public.posts(author);
create index if not exists idx_posts_published_created on public.posts(published, created_at desc);
create index if not exists idx_posts_tags on public.posts using gin(tags);
create index if not exists idx_posts_slug on public.posts(slug);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_follows_following_id on public.follows(following_id);
create index if not exists idx_post_tags_tag_id on public.post_tags(tag_id);
create index if not exists idx_views_post_id on public.views(post_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes = likes + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes = greatest(0, likes - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.increment_post_views(post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set views = views + 1
  where id = post_id and published = true;

  insert into public.views (post_id, user_id)
  values (post_id, auth.uid());
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.increment_post_views(uuid) from public;
grant execute on function public.increment_post_views(uuid) to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

drop trigger if exists trg_posts_like_sync_insert on public.likes;
create trigger trg_posts_like_sync_insert
after insert on public.likes
for each row execute function public.sync_post_like_count();

drop trigger if exists trg_posts_like_sync_delete on public.likes;
create trigger trg_posts_like_sync_delete
after delete on public.likes
for each row execute function public.sync_post_like_count();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.views enable row level security;

-- profiles
create policy if not exists "profiles_public_read"
on public.profiles
for select
using (true);

create policy if not exists "profiles_insert_own"
on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy if not exists "profiles_update_own"
on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- posts
create policy if not exists "posts_read_published_or_owner"
on public.posts
for select
using (published = true or (select auth.uid()) = author);

create policy if not exists "posts_insert_writer_admin"
on public.posts
for insert to authenticated
with check (
  (select auth.uid()) = author
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'writer')
  )
);

create policy if not exists "posts_update_owner_or_admin"
on public.posts
for update to authenticated
using (
  (select auth.uid()) = author
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  (select auth.uid()) = author
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

create policy if not exists "posts_delete_owner_or_admin"
on public.posts
for delete to authenticated
using (
  (select auth.uid()) = author
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

-- comments
create policy if not exists "comments_read_all"
on public.comments
for select
using (true);

create policy if not exists "comments_insert_authenticated"
on public.comments
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy if not exists "comments_delete_owner_or_admin"
on public.comments
for delete to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

-- likes
create policy if not exists "likes_read_all"
on public.likes
for select
using (true);

create policy if not exists "likes_insert_own"
on public.likes
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy if not exists "likes_delete_own"
on public.likes
for delete to authenticated
using ((select auth.uid()) = user_id);

-- bookmarks
create policy if not exists "bookmarks_read_own"
on public.bookmarks
for select to authenticated
using ((select auth.uid()) = user_id);

create policy if not exists "bookmarks_insert_own"
on public.bookmarks
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy if not exists "bookmarks_delete_own"
on public.bookmarks
for delete to authenticated
using ((select auth.uid()) = user_id);

-- follows
create policy if not exists "follows_read_all"
on public.follows
for select
using (true);

create policy if not exists "follows_insert_own"
on public.follows
for insert to authenticated
with check ((select auth.uid()) = follower_id);

create policy if not exists "follows_delete_own"
on public.follows
for delete to authenticated
using ((select auth.uid()) = follower_id);

-- tags
create policy if not exists "tags_read_all"
on public.tags
for select
using (true);

create policy if not exists "post_tags_read_all"
on public.post_tags
for select
using (true);

-- views
create policy if not exists "views_read_all"
on public.views
for select
using (true);

create policy if not exists "views_insert_authenticated"
on public.views
for insert to authenticated
with check ((select auth.uid()) = user_id or user_id is null);

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy if not exists "post_images_public_read"
on storage.objects
for select
using (bucket_id = 'post-images');

create policy if not exists "post_images_insert_own_folder"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy if not exists "post_images_update_own"
on storage.objects
for update to authenticated
using (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
);

create policy if not exists "post_images_delete_own"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'post-images'
  and owner_id = (select auth.uid()::text)
);
