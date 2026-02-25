import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markdownToHTML, mapSeverityToADOSeverity } from "@/lib/adoUtils";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reportId } = body;

        if (!reportId) {
            return NextResponse.json({ error: "reportId is required" }, { status: 400 });
        }

        // 1. Initialize Supabase Admin
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Supabase environment variables are missing" }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 2. Fetch ADO Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("ado_config")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (configError || !config) {
            console.error("ADO Config Error:", configError);
            return NextResponse.json({ error: "Azure DevOps configuration not found. Please set it up in the settings." }, { status: 400 });
        }

        // 3. Fetch Bug Report
        const { data: report, error: reportError } = await supabaseAdmin
            .from("bug_reports")
            .select("*")
            .eq("id", reportId)
            .single();

        if (reportError || !report) {
            return NextResponse.json({ error: "Bug report not found" }, { status: 404 });
        }

        // 4. Prepare ADO Request (JSON Patch)
        const auth = Buffer.from(`:${config.pat}`).toString("base64");
        const baseUrl = config.org_url.endsWith('/') ? config.org_url.slice(0, -1) : config.org_url;
        const adoUrl = `${baseUrl}/${encodeURIComponent(config.project_name)}/_apis/wit/workitems/$Bug?api-version=7.0`;

        const patch = [
            {
                op: "add",
                path: "/fields/System.Title",
                value: report.title || "Bug Report from Screen-to-Bug",
            },
            {
                op: "add",
                path: "/fields/System.Description",
                value: markdownToHTML(report.raw_markdown),
            },
            {
                op: "add",
                path: "/fields/Microsoft.VSTS.Common.Severity",
                value: mapSeverityToADOSeverity(report.severity),
            }
        ];

        // Add custom fields if they exist
        if (config.custom_fields && typeof config.custom_fields === 'object') {
            Object.entries(config.custom_fields).forEach(([key, value]) => {
                // Ensure key starts with /fields/ if not already provided
                const fullPath = key.startsWith('/') ? key : `/fields/${key}`;
                patch.push({
                    op: "add",
                    path: fullPath,
                    value: value
                });
            });
        }

        console.log("Pushing to ADO:", adoUrl);

        // 5. Call ADO API
        const response = await fetch(adoUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json-patch+json",
                "Accept": "application/json",
            },
            body: JSON.stringify(patch),
        });

        const contentType = response.headers.get("content-type");
        const responseText = await response.text();

        if (contentType && contentType.includes("application/json")) {
            const result = JSON.parse(responseText);
            if (!response.ok) {
                console.error("ADO API Error:", result);
                return NextResponse.json({ error: result.message || "Azure DevOps API Error" }, { status: response.status });
            }

            // 6. Update Bug Report with Work Item ID
            const workItemId = result.id.toString();
            await supabaseAdmin
                .from("bug_reports")
                .update({ ado_work_item_id: workItemId })
                .eq("id", reportId);

            const adoWorkItemUrl = `${baseUrl}/${encodeURIComponent(config.project_name)}/_workitems/edit/${workItemId}`;

            return NextResponse.json({
                success: true,
                id: workItemId,
                url: adoWorkItemUrl
            });
        } else {
            console.error("ADO returned non-JSON response:", responseText);
            let errorMessage = `Azure DevOps returned an unexpected response format (${response.status}).`;

            if (response.status === 203) {
                errorMessage = "Authentication Failed (Status 203). This usually means your PAT is incorrect or doesn't have the 'Work Items: Read & Write' scope selected.";
            } else if (response.status === 404) {
                errorMessage = "Project or Resource not found (Status 404). Please verify your Organization URL and Project Name.";
            }

            return NextResponse.json({ error: errorMessage }, { status: response.status === 203 ? 401 : 500 });
        }

    } catch (error: any) {
        console.error("Critical error in ADO integration:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
