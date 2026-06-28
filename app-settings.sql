-- =====================================================================
--  Magnum CPA Portal — App Settings (admin-controlled key/value store)
--  Used for the Google Review invite (link + on/off toggle), and any
--  future site-wide settings. Run ONCE in Supabase → SQL Editor.
--  Safe to re-run.
-- =====================================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Anyone may read settings (clients need the Google review link).
drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings for select
  using (true);

-- Only admins may add or change settings.
drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());
