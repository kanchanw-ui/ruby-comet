import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { org_url, project_name, pat } = body;

        if (!org_url || !project_name || !pat) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const auth = Buffer.from(`:${pat}`).toString("base64");
        const baseUrl = org_url.endsWith('/') ? org_url.slice(0, -1) : org_url;

        // Use the list projects API to verify access
        const adoUrl = `${baseUrl}/_apis/projects/${encodeURIComponent(project_name)}?api-version=7.0`;

        console.log("Testing ADO connection:", adoUrl);

        const response = await fetch(adoUrl, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Accept": "application/json",
            },
        });

        const contentType = response.headers.get("content-type");
        const responseText = await response.text();

        if (contentType && contentType.includes("application/json")) {
            const result = JSON.parse(responseText);
            if (!response.ok) {
                return NextResponse.json({
                    error: result.message || "Connection failed. Check your PAT and Project name."
                }, { status: response.status });
            }
            return NextResponse.json({ success: true, projectName: result.name });
        } else {
            console.error("ADO Test Result (Non-JSON):", responseText);
            let errorMessage = `Unexpected response from Azure DevOps (${response.status}).`;

            if (response.status === 203) {
                errorMessage = "Authentication Failed (Status 203). Ensure your PAT is correctly copied and has 'Project: Read' and 'Work Items: Read & Write' scopes.";
            }

            return NextResponse.json({
                error: errorMessage
            }, { status: response.status === 203 ? 401 : 500 });
        }

    } catch (error: any) {
        console.error("ADO test connection error:", error);
        return NextResponse.json({ error: error.message || "Failed to connect to Azure DevOps" }, { status: 500 });
    }
}
