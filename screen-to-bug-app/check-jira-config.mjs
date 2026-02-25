import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sfjmgsqdrlyxlmfpbsec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmam1nc3Fkcmx5eGxtZnBic2VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc3MzkyMywiZXhwIjoyMDg3MzQ5OTIzfQ.LpliuzCdsmHLoqtR_dmh2flwZ7df-ixCeLeH5zWo8Ao";

async function checkJiraConfig() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('jira_config').select('*').order('created_at', { ascending: false }).limit(1).single();

    if (error) {
        console.log("Error fetching Jira config:", error.message);
        return;
    }

    console.log("Current Jira Config:");
    console.log("Domain:", data.domain);
    console.log("Project Key:", data.project_key);
    console.log("Email:", data.email);
    console.log("API Token (masked):", data.api_token ? data.api_token.substring(0, 4) + "..." : "EMPTY");
}

checkJiraConfig();
