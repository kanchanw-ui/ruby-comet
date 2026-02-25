import { createClient } from "@supabase/supabase-js";

async function checkConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log("Missing Supabase credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('ado_config').select('*').limit(1).single();

    if (error) {
        console.log("Error fetching config:", error.message);
        return;
    }

    console.log("Current ADO Config:");
    console.log("Org URL:", data.org_url);
    console.log("Project:", data.project_name);
    console.log("PAT (masked):", data.pat ? data.pat.substring(0, 4) + "..." : "EMPTY");
    console.log("Custom Fields:", JSON.stringify(data.custom_fields, null, 2));
}

checkConfig();
