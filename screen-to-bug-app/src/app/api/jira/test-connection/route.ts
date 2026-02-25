import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { domain, email, api_token, project_key } = await request.json();

        // Normalize domain: remove https:// and trailing slash
        let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        const auth = Buffer.from(`${email}:${api_token}`).toString("base64");
        const jiraUrl = `https://${cleanDomain}/rest/api/3/project/${project_key}`;

        console.log("Testing Jira connection:", jiraUrl);

        const response = await fetch(jiraUrl, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Accept": "application/json",
                "Accept-Language": "en-US",
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return NextResponse.json({
                error: result.errorMessages?.[0] || result.errors?.projectKey || "Connection failed. Check your credentials."
            }, { status: response.status });
        }

        return NextResponse.json({ success: true, projectName: result.name });

    } catch (error: any) {
        console.error("Jira test connection error:", error);
        return NextResponse.json({ error: "Failed to connect to Jira" }, { status: 500 });
    }
}
