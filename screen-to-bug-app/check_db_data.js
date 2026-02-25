const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzM5MjMsImV4cCI6MjA4NzM0OTkyM30.hhXaWysK-hkL5pwCpTqX-ePzkJrVCk07MWw36n6K1Aw";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

// Use anon key to simulate the client-side browser query
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('=== Testing with ANON key (same as browser) ===\n');

    console.log('--- Bug Reports ---');
    const { data: reports, error: reportError } = await supabase
        .from('bug_reports')
        .select(`id, title, severity, created_at, recording:recordings(status)`)
        .order('created_at', { ascending: false })
        .limit(5);

    if (reportError) {
        console.error('Error fetching reports:', JSON.stringify(reportError, null, 2));
    } else {
        console.log('Reports count:', reports?.length);
        console.log(JSON.stringify(reports, null, 2));
    }

    console.log('\n--- Recordings ---');
    const { data: recordings, error: recError } = await supabase
        .from('recordings')
        .select('id, status, storage_path, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (recError) {
        console.error('Error fetching recordings:', JSON.stringify(recError, null, 2));
    } else {
        console.log('Recordings count:', recordings?.length);
        console.log(JSON.stringify(recordings, null, 2));
    }

    console.log('\n--- Storage files ---');
    const { data: files, error: storageError } = await supabase.storage
        .from('recordings')
        .list('recordings', { limit: 5 });

    if (storageError) {
        console.error('Error listing storage:', JSON.stringify(storageError, null, 2));
    } else {
        console.log('Files in storage:', files?.length);
        console.log(JSON.stringify(files?.map(f => f.name), null, 2));
    }
}

checkData().catch(console.error);
