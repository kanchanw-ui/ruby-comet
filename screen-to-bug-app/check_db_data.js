const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Bug Reports ---');
    const { data: reports, error: reportError } = await supabase
        .from('bug_reports')
        .select('id, title, recording_id, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (reportError) console.error(reportError);
    else console.log(reports);

    console.log('\n--- Recordings ---');
    const { data: recordings, error: recError } = await supabase
        .from('recordings')
        .select('id, status, storage_path, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (recError) console.error(recError);
    else console.log(recordings);
}

checkData();
