-- Safe migration for existing projects upgrading to Inkflow SaaS build
create extension if not exists pgcrypto;

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists twitter_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists role text not null default 'reader';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

alter table public.posts add column if not exists excerpt text;
alter table public.posts add column if not exists cover_image text;
alter table public.posts add column if not exists views integer not null default 0;
alter table public.posts add column if not exists likes integer not null default 0;
alter table public.posts add column if not exists published_at timestamptz;
alter table public.posts add column if not exists seo_title text;
alter table public.posts add column if not exists seo_description text;
alter table public.posts add column if not exists updated_at timestamptz not null default now();

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

create index if not exists idx_posts_published_created on public.posts(published, created_at desc);
create index if not exists idx_posts_tags on public.posts using gin(tags);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_views_post_id on public.views(post_id);

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

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

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

drop trigger if exists trg_posts_like_sync_insert on public.likes;
create trigger trg_posts_like_sync_insert
after insert on public.likes
for each row execute function public.sync_post_like_count();

drop trigger if exists trg_posts_like_sync_delete on public.likes;
create trigger trg_posts_like_sync_delete
after delete on public.likes
for each row execute function public.sync_post_like_count();

alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.views enable row level security;

create policy if not exists "likes_read_all" on public.likes for select using (true);
create policy if not exists "likes_insert_own" on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy if not exists "likes_delete_own" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);

create policy if not exists "bookmarks_read_own" on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
create policy if not exists "bookmarks_insert_own" on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy if not exists "bookmarks_delete_own" on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);

create policy if not exists "follows_read_all" on public.follows for select using (true);
create policy if not exists "follows_insert_own" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy if not exists "follows_delete_own" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

create policy if not exists "tags_read_all" on public.tags for select using (true);
create policy if not exists "post_tags_read_all" on public.post_tags for select using (true);

create policy if not exists "views_read_all" on public.views for select using (true);
create policy if not exists "views_insert_authenticated" on public.views for insert to authenticated with check ((select auth.uid()) = user_id or user_id is null);
