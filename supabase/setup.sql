-- Engineering Knowledge Hub — Supabase setup.
-- Run in the Supabase SQL Editor. Safe to re-run.
--
-- BEFORE RUNNING: replace you@example.com below with the email of the Supabase
-- Auth user you sign in with (Authentication -> Users -> Add user).
-- Also turn OFF "Allow new users to sign up" (Authentication -> Sign In / Providers)
-- so nobody else can create an account.

-- 1. Table: one row for content (id = 'primary_hub'), one for study progress (id = 'primary_progress').
create table if not exists public.knowledge_hub_store (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.knowledge_hub_store enable row level security;

-- 2. Remove the old policies that let anyone write with the public key.
drop policy if exists "Public Read Access" on public.knowledge_hub_store;
drop policy if exists "Public Write Access" on public.knowledge_hub_store;
drop policy if exists "Public Update Access" on public.knowledge_hub_store;
drop policy if exists "Anyone can read" on public.knowledge_hub_store;
drop policy if exists "Owner can insert" on public.knowledge_hub_store;
drop policy if exists "Owner can update" on public.knowledge_hub_store;
drop policy if exists "Owner can delete" on public.knowledge_hub_store;

-- 3. Everyone can read (the site is a public knowledge base); only the owner can write.
create policy "Anyone can read"
  on public.knowledge_hub_store for select
  using (true);

create policy "Owner can insert"
  on public.knowledge_hub_store for insert to authenticated
  with check ((select auth.jwt() ->> 'email') = 'you@example.com');

create policy "Owner can update"
  on public.knowledge_hub_store for update to authenticated
  using ((select auth.jwt() ->> 'email') = 'you@example.com')
  with check ((select auth.jwt() ->> 'email') = 'you@example.com');

create policy "Owner can delete"
  on public.knowledge_hub_store for delete to authenticated
  using ((select auth.jwt() ->> 'email') = 'you@example.com');
