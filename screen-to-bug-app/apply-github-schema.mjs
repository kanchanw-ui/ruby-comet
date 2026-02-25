import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
    console.log('Applying GitHub Integration schema updates...');

    // Note: We can't easily run arbitrary SQL via the JS client without a custom function.
    // We'll check if the table exists first.

    const { error: githubConfigError } = await supabase
        .from('github_config')
        .select('id')
        .limit(1);

    if (githubConfigError && githubConfigError.code === '42P01') {
        console.log('github_config table missing. Please run the SQL in migrations/github_integration.sql');
    } else {
        console.log('github_config table exists.');
    }

    // Check bug_reports columns
    const { data: bugReports, error: bugReportsError } = await supabase
        .from('bug_reports')
        .select('*')
        .limit(1);

    if (bugReports && bugReports.length > 0) {
        if (bugReports[0].github_issue_number === undefined) {
            console.log('github_issue_number column missing in bug_reports.');
        } else {
            console.log('github_issue_number column exists.');
        }
    }

    console.log('Please execute the following SQL in your Supabase SQL Editor:');
    console.log(`
-- 5.1 GitHub Configuration table
create table if not exists public.github_config (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  repo text not null,
  pat text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update bug_reports
alter table public.bug_reports 
add column if not exists github_issue_number integer,
add column if not exists github_repo_full_name text;

-- Enable RLS
alter table public.github_config enable row level security;

-- Create Policies
create policy "Allow public access to github_config" on public.github_config
  for all using (true) with check (true);
  `);
}

updateSchema();
