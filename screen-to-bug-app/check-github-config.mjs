import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve('.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
            }
        });
    } catch (e) {
        console.error('Could not load .env.local');
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConfig() {
    try {
        const { data, error } = await supabase
            .from('github_config')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching config:', error);
            return;
        }

        console.log('--- GitHub Configuration ---');
        console.log('Owner:', data.owner);
        console.log('Repo:', data.repo);
        console.log('PAT (last 4):', data.pat ? '...' + data.pat.slice(-4) : 'None');
        console.log('---------------------------');
    } catch (e) {
        console.error('Script error:', e);
    }
}

checkConfig();
