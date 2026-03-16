-- Add playwright_script column for regression test scripts generated from bug report steps
alter table public.bug_reports
  add column if not exists playwright_script text;
