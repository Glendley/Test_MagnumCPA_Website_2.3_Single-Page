-- =====================================================================
--  Magnum CPA — FINAL reconciliation script
--  Run this in Supabase → SQL Editor → Run, AFTER supabase-schema.sql.
--  Safe to re-run. Makes the popup login + the full dashboard pages
--  (admin.html / dashboard.html) work together, and flags the admin.
-- =====================================================================

-- 1. Make sure profiles has every column the pages use.
alter table public.profiles add column if not exists name       text;
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists role       text not null default 'client';

-- 2. On signup, fill BOTH name + full_name from whatever the form sent.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '');
  insert into public.profiles (id, email, name, full_name)
  values (new.id, new.email, nm, nm)
  on conflict (id) do update
     set email     = excluded.email,
         name      = coalesce(nullif(excluded.name,''),      public.profiles.name),
         full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Admin = the admin email OR any profile with role = 'admin'.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in ('ask@magnumcpa.com')
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 4. Backfill names for anyone who already signed up.
update public.profiles p
   set name      = coalesce(nullif(p.name,''),      u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
       full_name = coalesce(nullif(p.full_name,''), u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')
  from auth.users u
 where u.id = p.id;

-- 5. Confirm + promote the admin account.
update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now())
 where email = 'ask@magnumcpa.com';
update public.profiles
   set role = 'admin'
 where email = 'ask@magnumcpa.com';

-- 6. Verify — admin row should show role = admin.
select email, name, role from public.profiles order by created_at;
