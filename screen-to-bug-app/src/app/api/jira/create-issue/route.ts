import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markdownToADF, mapSeverityToPriority } from "@/lib/jiraUtils";

export async function POST(request: Request) {
    try {
        const { reportId } = await request.json();

        // 1. Initialize Supabase with Service Role to fetch Jira credentials
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Fetch Jira Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("jira_config")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (configError || !config) {
            return NextResponse.json({ error: "Jira configuration not found" }, { status: 400 });
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

        // 4. Prepare Jira Request
        const cleanDomain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const auth = Buffer.from(`${config.email}:${config.api_token}`).toString("base64");
        const jiraUrl = `https://${cleanDomain}/rest/api/3/issue`;

        const body = {
            fields: {
                project: {
                    key: config.project_key,
                },
                summary: report.title || "Bug Report from Screen-to-Bug",
                description: markdownToADF(report.raw_markdown),
                issuetype: {
                    name: config.issue_type || "Bug",
                },
                priority: mapSeverityToPriority(report.severity),
            },
        };

        console.log("Pushing to Jira:", jiraUrl);

        // 5. Call Jira API
        const response = await fetch(jiraUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Language": "en-US",
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Jira API Error:", result);

            let message = "Jira API Error";
            if (result.errorMessages && result.errorMessages.length > 0) {
                message = result.errorMessages.join(", ");
            } else if (result.errors) {
                message = Object.entries(result.errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join("; ");
            }

            return NextResponse.json({ error: message }, { status: response.status });
        }

        // 6. Update Bug Report with Issue Key
        await supabaseAdmin
            .from("bug_reports")
            .update({ jira_issue_key: result.key })
            .eq("id", reportId);

        return NextResponse.json({
            success: true,
            key: result.key,
            url: `https://${cleanDomain}/browse/${result.key}`
        });

    } catch (error: any) {
        console.error("Critical error in Jira integration:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
