-- ==========================================================
-- FIX: Add missing RLS policies for recordings and bug_reports
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sfjmgsqdrlyxlmfpbsec/sql
-- ==========================================================

-- Allow anyone to read recordings
create policy "Allow public read access to recordings"
  on public.recordings
  for select using (true);

-- Allow anyone to insert recordings
create policy "Allow public insert to recordings"
  on public.recordings
  for insert with check (true);

-- Allow anyone to update recordings
create policy "Allow public update to recordings"
  on public.recordings
  for update using (true) with check (true);

-- Allow anyone to read bug_reports
create policy "Allow public read access to bug_reports"
  on public.bug_reports
  for select using (true);

-- Allow anyone to insert bug_reports
create policy "Allow public insert to bug_reports"
  on public.bug_reports
  for insert with check (true);

-- Allow anyone to update bug_reports
create policy "Allow public update to bug_reports"
  on public.bug_reports
  for update using (true) with check (true);
