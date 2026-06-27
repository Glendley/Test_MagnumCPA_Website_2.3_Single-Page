-- =====================================================================
--  Make the admin account — Magnum CPA Portal
--
--  STEP 1 (do this FIRST):
--    Open client-portal.html → "Sign Up" tab and create the account:
--        Full Name: Magnum CPA
--        Email:     ask@magnumcpa.com
--        Password:  Magnum!2026
--
--  STEP 2:
--    Paste this whole file into Supabase → SQL Editor → Run.
--    It (a) marks the email confirmed so login is instant, and
--        (b) promotes the account to admin.
-- =====================================================================

-- (a) confirm the email (skips the email-link step)
update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now())
 where email = 'ask@magnumcpa.com';

-- (b) make sure a profile row exists for this account AND set it to admin.
--     (Covers the case where the account was created before the trigger existed.)
insert into public.profiles (id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'name',''), 'admin'
  from auth.users
 where email = 'ask@magnumcpa.com'
on conflict (id) do update set role = 'admin';

-- (c) verify — this should return ONE row showing role = admin
select email, role
  from public.profiles
 where email = 'ask@magnumcpa.com';
