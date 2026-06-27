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

-- (b) promote to admin
update public.profiles
   set role = 'admin'
 where email = 'ask@magnumcpa.com';

-- (c) verify — this should return one row showing role = admin
select email, role
  from public.profiles
 where email = 'ask@magnumcpa.com';
