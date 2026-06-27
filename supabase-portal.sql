-- =====================================================================
--  Magnum CPA — schema for the SINGLE-PAGE embedded portal (index.html)
--  Run this in Supabase → SQL Editor → Run.  Safe to re-run.
--
--  This matches what index.html actually uses:
--    • profiles (id, email, full_name)         — client accounts
--    • organizer_submissions                   — submitted tax organizers
--    • document_uploads                         — upload log
--    • storage bucket  client-documents         — the actual files
--    • admin = any email listed in is_admin()   — matches ADMIN_EMAILS in index.html
-- =====================================================================

-- ---------- profiles -------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- ---------- admin check (matches ADMIN_EMAILS in index.html) ---------
-- SECURITY DEFINER so it can be used inside policies without recursion.
-- To add an admin, add their email to the list below AND to ADMIN_EMAILS
-- in index.html.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in ('ask@magnumcpa.com');
$$;

-- ---------- auto-create a profile row on signup ---------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',
                   new.raw_user_meta_data->>'name', ''))
  on conflict (id) do update
     set email     = excluded.email,
         full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that signed up before this ran.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name','')
  from auth.users u
on conflict (id) do nothing;

-- ---------- organizer submissions -----------------------------------
create table if not exists public.organizer_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  data         text,
  submitted_at timestamptz not null default now()
);

-- ---------- document upload log -------------------------------------
create table if not exists public.document_uploads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  count       int,
  uploaded_at timestamptz not null default now()
);

-- ---------- Row-Level Security --------------------------------------
alter table public.profiles              enable row level security;
alter table public.organizer_submissions enable row level security;
alter table public.document_uploads      enable row level security;

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

drop policy if exists os_select on public.organizer_submissions;
create policy os_select on public.organizer_submissions for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists os_insert on public.organizer_submissions;
create policy os_insert on public.organizer_submissions for insert
  with check (user_id = auth.uid());

drop policy if exists du_select on public.document_uploads;
create policy du_select on public.document_uploads for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists du_insert on public.document_uploads;
create policy du_insert on public.document_uploads for insert
  with check (user_id = auth.uid());

-- ---------- storage bucket: client-documents ------------------------
-- Files live at  clients/<user_id>/<filename>  (and clients/<uid>/organizer/...)
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

drop policy if exists cd_insert on storage.objects;
create policy cd_insert on storage.objects for insert
  with check (bucket_id = 'client-documents'
              and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists cd_select on storage.objects;
create policy cd_select on storage.objects for select
  using (bucket_id = 'client-documents'
         and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));
drop policy if exists cd_update on storage.objects;
create policy cd_update on storage.objects for update
  using (bucket_id = 'client-documents'
         and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));
drop policy if exists cd_delete on storage.objects;
create policy cd_delete on storage.objects for delete
  using (bucket_id = 'client-documents'
         and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));

-- =====================================================================
--  Done. Admin = ask@magnumcpa.com (matches ADMIN_EMAILS in index.html).
--  Turn OFF "Confirm email" under Authentication → Providers → Email so
--  new sign-ups can log in immediately.
-- =====================================================================
