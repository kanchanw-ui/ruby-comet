const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: recordings } = await supabase.from('recordings').select('id').order('created_at', { ascending: false }).limit(1);
    if (recordings?.length > 0) {
        const id = recordings[0].id;
        for (let i = 0; i < id.length; i++) {
            process.stdout.write(id[i]);
        }
        process.stdout.write('\n');
    }
}

check();
