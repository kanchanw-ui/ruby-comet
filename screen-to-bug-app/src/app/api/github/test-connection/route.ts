import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        let { owner, repo, pat } = await request.json();
        owner = owner?.trim();
        repo = repo?.trim();
        pat = pat?.trim();

        if (!owner || !repo || !pat) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // GitHub API: Get Repository
        const githubUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const response = await fetch(githubUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${pat}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept-Language": "en-US"
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({
                error: errorData.message || "Failed to connect to GitHub"
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            success: true,
            repoName: data.full_name
        });

    } catch (error: any) {
        console.error("GitHub test connection error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
