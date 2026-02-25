import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
    } catch (e) { }
}

loadEnv();

async function testGitHubAPI() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: config } = await supabase.from('github_config').select('*').limit(1).single();

    console.log(`OWNER: ${config.owner}`);
    console.log(`REPO: ${config.repo}`);

    const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: {
            'Authorization': `Bearer ${config.pat}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ScreenToBug'
        }
    });

    const data = await response.json();
    if (!response.ok) {
        console.log('API_ERROR:', JSON.stringify(data));
        return;
    }

    console.log(`IS_PRIVATE: ${data.private}`);
    console.log(`HAS_ISSUES: ${data.has_issues}`);
    console.log(`PERMISSIONS: ${JSON.stringify(data.permissions)}`);
}

testGitHubAPI();
