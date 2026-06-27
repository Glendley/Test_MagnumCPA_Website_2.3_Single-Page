# Magnum CPA Website — Setup Guide

## Your File Structure

```
single page magnum/
├── index.html          ← Main website (has portal built in)
├── organizer.js        ← Tax organizer form schema
├── site.js             ← Nav, footer, social links
├── search.js           ← Site search overlay
├── sync.bat            ← Double-click to push to GitHub
├── images/             ← All your image assets
└── README.md           ← This file
```

---

## STEP 1 — Set Up GitHub (One Time)

1. Make sure [Git](https://git-scm.com/download/win) is installed on your PC
2. Open **Command Prompt** and run:
   ```
   git config --global user.name "Glenn"
   git config --global user.email "ask@magnumcpa.com"
   ```
3. Go to [github.com/Glendley/Test_MagnumCPA_Website_2.3_Single-Page](https://github.com/Glendley/Test_MagnumCPA_Website_2.3_Single-Page) and make sure the repo exists

### Enable GitHub Pages (to make it a live website)
1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → folder: **/ (root)**
4. Click **Save**
5. Your site will be live at: `https://glendley.github.io/Test_MagnumCPA_Website_2.3_Single-Page/`

---

## STEP 2 — Set Up Supabase (Free — for Login + Document Storage)

### Create your Supabase project
1. Go to [supabase.com](https://supabase.com) → **Start for free**
2. Create a new project (name it: `magnum-cpa`)
3. Save your **database password** somewhere safe

### Get your API keys
1. In Supabase → **Project Settings** → **API**
2. Copy your:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Add keys to your website
Open `index.html` and find these lines near the bottom:
```javascript
var SUPABASE_URL  = 'YOUR_SUPABASE_URL';
var SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
var ADMIN_EMAILS  = ['ask@magnumcpa.com'];
```
Replace with your actual values:
```javascript
var SUPABASE_URL  = 'https://xxxx.supabase.co';
var SUPABASE_ANON = 'eyJhbGci...your-full-key...';
var ADMIN_EMAILS  = ['ask@magnumcpa.com'];  // ← your admin email
```

### Create the database tables
In Supabase → **SQL Editor** → **New query** → paste and run:

```sql
-- Client profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  job text,
  dob date,
  addr text,
  created_at timestamptz default now()
);

-- Tax organizer submissions
create table if not exists organizer_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  email text,
  data jsonb,
  submitted_at timestamptz default now()
);

-- Document upload log
create table if not exists document_uploads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  count int,
  uploaded_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row-level security
alter table profiles enable row level security;
alter table organizer_submissions enable row level security;
alter table document_uploads enable row level security;

create policy "Users see own profile" on profiles for all using (auth.uid() = id);
create policy "Users see own submissions" on organizer_submissions for all using (auth.uid() = user_id);
create policy "Users see own uploads" on document_uploads for all using (auth.uid() = user_id);
```

### Create the file storage bucket
1. Supabase → **Storage** → **New bucket**
2. Name: `client-documents`
3. Public: **No** (keep private)
4. Go to **Policies** → add policy:
   - Name: `Clients manage own files`
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - Policy: `(storage.foldername(name))[1] = 'clients' AND (storage.foldername(name))[2] = auth.uid()::text`

### Enable Email Auth
1. Supabase → **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Optional: disable "Confirm email" for easier testing (Authentication → Settings → toggle off)

---

## STEP 3 — Sync to GitHub Anytime

Whenever you update any file:
1. Save your changes
2. **Double-click `sync.bat`**
3. Done — GitHub updates automatically

Or use Terminal:
```
cd "C:\Users\Glenn\Documents\Claude\single page magnum"
git add . && git commit -m "update" && git push
```

---

## How the Portal Works

| Feature | How it works |
|---|---|
| Client creates account | Supabase Auth (email + password) |
| Client logs in | Supabase session stored in browser |
| Client uploads documents | Saved to Supabase Storage under `clients/{user_id}/` |
| Client fills Tax Organizer | Multi-step form → saved to `organizer_submissions` table |
| Admin logs in | Uses `ask@magnumcpa.com` — sees all clients + their docs |
| Admin views client files | Admin can browse and download any client's documents |

---

## Need Help?

- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- GitHub Pages docs: [docs.github.com/pages](https://docs.github.com/en/pages)
- Your GitHub repo: [github.com/Glendley/Test_MagnumCPA_Website_2.3_Single-Page](https://github.com/Glendley/Test_MagnumCPA_Website_2.3_Single-Page)
