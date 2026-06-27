-- =====================================================================
--  Magnum CPA Portal — Supabase schema, security, and storage
--  Run this ONCE in your Supabase project: SQL Editor → New query → Run.
--  Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / drop-then-create).
-- =====================================================================

-- ---------- tables --------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  phone      text,
  sex        text,
  dob        text,
  job        text,
  addr       text,
  bio        text,
  photo      text,                       -- small avatar as data URL
  asana_url  text,
  role       text not null default 'client',
  created_at timestamptz not null default now()
);

-- If a profiles table already existed (e.g. from a Supabase template) it may be
-- missing columns — add any that aren't there so the rest of the script works.
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists name       text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists sex        text;
alter table public.profiles add column if not exists dob        text;
alter table public.profiles add column if not exists job        text;
alter table public.profiles add column if not exists addr       text;
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists photo      text;
alter table public.profiles add column if not exists asana_url  text;
alter table public.profiles add column if not exists role       text not null default 'client';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create table if not exists public.organizer (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.updates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text,
  task       text,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  notes      text,
  drive      text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,  -- the client thread
  sender     text not null check (sender in ('client','team')),
  text       text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,  -- the related client
  recipient  text not null check (recipient in ('client','admin')),
  text       text,
  type       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  name       text,
  photo      text,
  rating     int,
  text       text,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- helper: is the current user an admin? -------------------
-- Defined AFTER profiles so the column reference validates.
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- auto-create a profile row on signup ---------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- enable Row-Level Security -------------------------------
alter table public.profiles      enable row level security;
alter table public.organizer     enable row level security;
alter table public.updates       enable row level security;
alter table public.meetings      enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews       enable row level security;

-- ---------- policies ------------------------------------------------
-- profiles: a user sees/edits their own row; admins see/edit all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- organizer: own row, or admin.
drop policy if exists organizer_all on public.organizer;
create policy organizer_all on public.organizer for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- updates: client reads own; only admin writes.
drop policy if exists updates_select on public.updates;
create policy updates_select on public.updates for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists updates_write on public.updates;
create policy updates_write on public.updates for all
  using (public.is_admin()) with check (public.is_admin());

-- meetings: client reads own; only admin writes.
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists meetings_write on public.meetings;
create policy meetings_write on public.meetings for all
  using (public.is_admin()) with check (public.is_admin());

-- chat: client and admin both read the client's thread; client posts as
-- 'client', admin posts as 'team'.
drop policy if exists chat_select on public.chat_messages;
create policy chat_select on public.chat_messages for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages for insert
  with check (
    (user_id = auth.uid() and sender = 'client')
    or (public.is_admin() and sender = 'team')
  );

-- notifications: client <-> admin.
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select
  using (
    (recipient = 'client' and user_id = auth.uid())
    or (recipient = 'admin' and public.is_admin())
  );
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert
  with check (
    (recipient = 'admin'  and user_id = auth.uid())   -- client pings admin
    or (recipient = 'client' and public.is_admin())   -- admin pings client
  );
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update
  using (
    (recipient = 'client' and user_id = auth.uid())
    or (recipient = 'admin' and public.is_admin())
  );

-- reviews: anyone (incl. anonymous public site) can read APPROVED reviews;
-- a client also sees their own; admin sees all. Client manages own; admin all.
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews for select
  using (approved = true or user_id = auth.uid() or public.is_admin());
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert
  with check (user_id = auth.uid());
drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------- storage bucket for uploaded documents -------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Files are stored at  <user_id>/<field_id>/<filename>
-- so the first path folder identifies the owner.
drop policy if exists docs_insert on storage.objects;
create policy docs_insert on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists docs_select on storage.objects;
create policy docs_select on storage.objects for select
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
drop policy if exists docs_update on storage.objects;
create policy docs_update on storage.objects for update
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
drop policy if exists docs_delete on storage.objects;
create policy docs_delete on storage.objects for delete
  using (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- =====================================================================
--  After running this:
--   1. Create your admin account (sign up once in the portal), then run:
--        update public.profiles set role = 'admin'
--        where email = 'admin@magnumcpa.com';
--   2. Auth → Providers → Email: turn OFF "Confirm email" for instant login
--      (or keep it on and confirm via the email link).
-- =====================================================================
