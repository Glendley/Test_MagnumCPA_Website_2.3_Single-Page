-- =====================================================================
--  Enable Supabase Realtime so chat messages and notifications appear
--  live (no page refresh). Run once in Supabase → SQL Editor. Safe to re-run.
-- =====================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception when others then null;  -- already added
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null;  -- already added
  end;
  begin
    alter publication supabase_realtime add table public.shared_files;
  exception when others then null;  -- already added
  end;
end $$;
