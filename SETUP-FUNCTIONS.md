# Backend setup — email on file share (#4) & Asana status updates (#6)

These two features need Supabase **Edge Functions** (a static GitHub Pages site can't
send email or receive webhooks on its own). The function code is in
`supabase/functions/`. You deploy them once.

## Prerequisites
- Install the Supabase CLI: https://supabase.com/docs/guides/cli
- `supabase login`
- `supabase link --project-ref nnvqdmdrhruqlhellnyw`

---

## #4 — Email the client when the admin shares a file  (function: notify-client)

1. **Resend account:** sign up at https://resend.com (free tier). To send from your
   own domain, add + verify it in Resend → Domains. For a quick test you can use the
   built-in `onboarding@resend.dev` sender.
2. **Get the API key:** Resend → API Keys → create one (`re_...`).
3. **Set the secrets** in Supabase:
   ```
   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   supabase secrets set EMAIL_FROM="Magnum CPA <noreply@yourdomain.com>"
   ```
   (If not verifying a domain yet, use `EMAIL_FROM="Magnum CPA <onboarding@resend.dev>"`.)
4. **Deploy:**
   ```
   supabase functions deploy notify-client
   ```
That's it — the admin portal already calls this function after a file upload
(`Magnum.emailClientFileShared`). If it isn't deployed, uploads still work; the email
is just skipped.

---

## #6 — Auto account-update when Asana filing / e-filing status changes  (function: asana-webhook)

1. **Create the small table** the function uses to store the webhook secret — run in
   Supabase → SQL Editor:
   ```sql
   create table if not exists public.asana_webhooks (
     id text primary key,
     secret text,
     created_at timestamptz not null default now()
   );
   alter table public.asana_webhooks enable row level security;  -- no policies: only the
   -- service role (used by the Edge Function) can touch it; the browser cannot.
   ```
2. **Get an Asana personal access token:** Asana → Settings → Apps → Developer apps →
   Personal access tokens. Set it:
   ```
   supabase secrets set ASANA_PAT=1/xxxxxxxxxxxx
   ```
3. **Deploy:**
   ```
   supabase functions deploy asana-webhook --no-verify-jwt
   ```
   (`--no-verify-jwt` is required so Asana can call it without a Supabase login.)
4. **Tell the function which board it's watching.** Edit the two lines at the top of
   `supabase/functions/asana-webhook/index.ts`:
   - `CLIENT_EMAIL_FIELD` — the Asana **custom field** on each task that holds the
     client's portal email (so we know which client to update).
   - `STATUS_FIELDS` — the field name(s) for **Filing** / **E-Filing** status.
   Re-deploy after editing.
5. **Create the webhook** (points Asana at the function). Replace the project gid:
   ```
   curl -H "Authorization: Bearer $ASANA_PAT" \
     -d "data[resource]=YOUR_PROJECT_GID" \
     -d "data[target]=https://nnvqdmdrhruqlhellnyw.supabase.co/functions/v1/asana-webhook" \
     https://app.asana.com/api/1.0/webhooks
   ```

### What I need from you to finish #6
- Your **Asana project** (gid or link) that tracks client filings.
- How a task identifies the client — is there a **custom field with the client's email**?
  If not, tell me what links a task to a client (project per client? task name? another field).
- The exact **field names** that represent "Filing" and "E-Filing" status, and their
  possible values (e.g. Not started / In progress / Filed).

Send me those and I'll set `CLIENT_EMAIL_FIELD` / `STATUS_FIELDS` precisely and confirm the webhook payload handling.
