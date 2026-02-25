import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapSeverityToGitHubLabels } from "@/lib/githubUtils";

export async function POST(request: Request) {
    try {
        const { reportId } = await request.json();

        // 1. Initialize Supabase Admin
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Fetch GitHub Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("github_config")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (configError || !config) {
            return NextResponse.json({ error: "GitHub configuration not found" }, { status: 400 });
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

        // 4. Prepare GitHub Request
        const owner = config.owner.trim();
        const repo = config.repo.trim();
        const pat = config.pat.trim();
        const githubUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;

        const body = {
            title: report.title || "Bug Report from Screen-to-Bug",
            body: report.raw_markdown,
            labels: mapSeverityToGitHubLabels(report.severity)
        };

        console.log("Pushing to GitHub:", githubUrl);

        // 5. Call GitHub API
        const response = await fetch(githubUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${pat}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept-Language": "en-US"
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("GitHub API Error:", result);
            let errorMsg = result.message || "GitHub API Error";
            if (result.errors) {
                const details = result.errors.map((e: any) => `${e.resource} ${e.field}: ${e.code}`).join(", ");
                errorMsg += ` (${details})`;
            }
            return NextResponse.json({ error: errorMsg }, { status: response.status });
        }

        // 6. Update Bug Report
        await supabaseAdmin
            .from("bug_reports")
            .update({
                github_issue_number: result.number,
                github_repo_full_name: `${config.owner}/${config.repo}`
            })
            .eq("id", reportId);

        return NextResponse.json({
            success: true,
            issueNumber: result.number,
            url: result.html_url
        });

    } catch (error: any) {
        console.error("GitHub integration error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
