-- Supabase schema for Screen-to-Bug prototype

-- 1. Enable Storage
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do nothing;

-- 2. Recordings table stores metadata about each uploaded screen recording.
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  storage_path text not null,
  status text not null check (status in ('pending_ai', 'ai_complete', 'report_finalized'))
);

-- 3. Bug reports table stores AI-generated and user-edited reports linked to recordings.
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  title text,
  raw_markdown text not null,
  severity text,
  jira_issue_key text, -- Jira task tracking
  ado_work_item_id text, -- ADO task tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Jira Configuration table
create table if not exists public.jira_config (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  project_key text not null,
  email text not null,
  api_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Azure DevOps Configuration table (Task 1.1: Added)
create table if not exists public.ado_config (
  id uuid primary key default gen_random_uuid(),
  org_url text not null,
  project_name text not null,
  pat text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Enable RLS on tables
alter table public.recordings enable row level security;
alter table public.bug_reports enable row level security;
alter table public.jira_config enable row level security;
alter table public.ado_config enable row level security;

-- 7. Create Policies for Public Access (Prototype Only)
-- Allow anyone to insert/select/update recordings (for the recording flow)
create policy "Allow public access to recordings" on public.recordings
  for all using (true) with check (true);

-- Allow anyone to insert/select/update bug reports (for the dashboard)
create policy "Allow public access to bug_reports" on public.bug_reports
  for all using (true) with check (true);

-- Allow anyone to insert/select/update jira_config (for settings)
create policy "Allow public access to jira_config" on public.jira_config
  for all using (true) with check (true);

-- Allow anyone to insert/select/update ado_config (for settings)
create policy "Allow public access to ado_config" on public.ado_config
  for all using (true) with check (true);

-- 8. Storage Policies (Allow anyone to upload to the 'recordings' bucket)
create policy "Allow public to upload recordings"
on storage.objects for insert
with check ( bucket_id = 'recordings' );

create policy "Allow public to read recordings"
on storage.objects for select
using ( bucket_id = 'recordings' );
