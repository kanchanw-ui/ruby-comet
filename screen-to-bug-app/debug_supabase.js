const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: recordings, error: recError } = await supabase.from('recordings').select('*');
    console.log('Recordings count:', recordings?.length);
    if (recordings?.length > 0) {
        console.log('Last recording:', recordings[recordings.length - 1]);
    }

    const { data: reports, error: repError } = await supabase.from('bug_reports').select('*');
    console.log('Reports count:', reports?.length);

    if (recError) console.error('Rec Error:', recError);
    if (repError) console.error('Rep Error:', repError);
}

check();
