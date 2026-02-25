import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

async function run() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check current config
    const { data: config, error: fetchError } = await supabase
        .from('ado_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching config:", fetchError);
        return;
    }

    console.log("Current Config:", config);

    // 2. Update to correct project and team based on user feedback
    // The user said: "I want to use PAR Notisphere project"
    // The screenshot showed "PAR Team" error and then "PAR Notisphere Team" error.
    // Let's try "PAR Notisphere" as project and "PAR Notisphere" as the team value.

    if (!config) {
        console.log("No config found to update.");
        return;
    }

    const updatedConfig = {
        ...config,
        project_name: "PAR Notisphere",
        custom_fields: {
            "PAR Team": "PAR Notisphere" // Trying this as a likely valid value
        },
        updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
        .from('ado_config')
        .upsert(updatedConfig);

    if (updateError) {
        console.error("Update failed:", updateError);
    } else {
        console.log("Successfully updated ADO configuration to use 'PAR Notisphere'.");
    }
}

run();
