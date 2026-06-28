-- =====================================================================
--  Magnum CPA Portal — Shared Files (two-way admin <-> client exchange)
--  Run this ONCE in Supabase: SQL Editor → New query → Run.
--  Safe to re-run.
-- =====================================================================

-- ---------- table ---------------------------------------------------
create table if not exists public.shared_files (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,  -- the client the file belongs to
  name        text,                       -- original file name
  path        text,                       -- storage path in the 'documents' bucket
  size        bigint,
  uploaded_by text not null check (uploaded_by in ('admin','client')),
  created_at  timestamptz not null default now()
);

alter table public.shared_files enable row level security;

-- client sees their own files; admin sees all.
drop policy if exists shared_files_select on public.shared_files;
create policy shared_files_select on public.shared_files for select
  using (user_id = auth.uid() or public.is_admin());

-- client may add files to their own record (tagged 'client');
-- admin may add files to any client's record (tagged 'admin').
drop policy if exists shared_files_insert on public.shared_files;
create policy shared_files_insert on public.shared_files for insert
  with check (
    (user_id = auth.uid() and uploaded_by = 'client')
    or (public.is_admin() and uploaded_by = 'admin')
  );

-- either side may remove a file on the record.
drop policy if exists shared_files_delete on public.shared_files;
create policy shared_files_delete on public.shared_files for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------- storage: let admins upload into a client's folder --------
-- The original docs_insert policy only allowed a user to write into their
-- OWN folder (<auth.uid()>/...). Admins need to drop files into a client's
-- folder (<client_id>/shared/...), so allow is_admin() too.
drop policy if exists docs_insert on storage.objects;
create policy docs_insert on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- (docs_select / docs_update / docs_delete already allow admins.)
