# Supabase Setup — Magnum CPA Portal

The client portal and admin portal now use **Supabase** (a hosted Postgres
database + authentication + file storage) instead of the browser's
`localStorage`. This means client data syncs across devices and is protected
per-user.

Your project is already wired in `supabase.js`:

- **Project URL:** `https://nnvqdmdrhruqlhellnyw.supabase.co`
- **anon key:** embedded in `supabase.js` (safe to ship — Row-Level Security protects the data)

Do the four steps below **once** to finish setup.

---

## 1. Create the database tables, security rules, and storage bucket

1. Open your project at <https://supabase.com/dashboard>.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open the file **`supabase-schema.sql`** (in this folder), copy everything,
   paste it into the editor, and click **Run**.
4. You should see "Success. No rows returned." This creates the tables
   (`profiles`, `organizer`, `documents` data, `updates`, `meetings`,
   `chat_messages`, `notifications`, `reviews`), all the access rules, and a
   private **`documents`** storage bucket.

*(The script is safe to run again if you ever need to.)*

## 2. Turn off email confirmation (recommended for instant login)

By default Supabase emails every new signup a confirmation link before they can
log in. For a smoother portal experience:

1. Sidebar → **Authentication** → **Providers** (or **Sign In / Up**) → **Email**.
2. Turn **OFF** "Confirm email".
3. Save.

*(If you prefer to keep it on, new clients must click the email link before
their first login — everything still works, just with that extra step.)*

## 3. Create your admin account

1. Open **`client-portal.html`** in the browser and use the **Sign Up** tab to
   create the admin account — e.g. email `admin@magnumcpa.com` with a strong
   password. (This makes the login; we promote it to admin next.)
2. Back in Supabase → **SQL Editor**, run:

   ```sql
   update public.profiles set role = 'admin'
   where email = 'admin@magnumcpa.com';
   ```

   (Use whatever email you signed up with.)
3. Now open **`admin-login.html`** and log in with that email/password — it will
   reach the admin dashboard. Regular client signups stay `role = 'client'` and
   cannot access the admin pages.

## 4. Test it

- **Client side:** open `client-portal.html`, sign up as a test client, fill in
  the profile + tax organizer (attach a file), send a chat message, leave a review.
- **Admin side:** open `admin-login.html`, log in as admin. You should see the
  test client, their uploaded file (Download link), organizer answers, chat
  message (reply to it), and the review (Feature it on the About page).
- **Public site:** a review you "Feature" appears in the **What Our Clients Say**
  slider on `index.html`.

---

## Notes & limits

- **Live updates:** pages load fresh data when opened/refreshed. A client won't
  see an admin's reply (or vice-versa) until they reload. If you'd like true
  real-time updates, enable Supabase **Realtime** on the `chat_messages` and
  `notifications` tables and I can add live subscriptions.
- **Files:** uploads go to the private `documents` bucket at
  `<user-id>/<field>/<filename>`. Download links are short-lived signed URLs
  (valid 1 hour), generated on demand. Only the owning client and admins can
  read them.
- **Passwords:** managed and hashed by Supabase Auth — they are never stored by
  the site and can't be exported (the old Excel "password" column is gone; the
  export now contains client info only).
- **Never** put the **`service_role`** key in any HTML/JS file — it bypasses all
  security. Only the `anon` key belongs in the browser.
