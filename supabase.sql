-- Run once in Supabase: SQL Editor > New query > paste > Run
create table if not exists public.nexus_chats (
  id bigint primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  msgs jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.nexus_chats enable row level security;
drop policy if exists "own rows" on public.nexus_chats;
create policy "own rows" on public.nexus_chats for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
