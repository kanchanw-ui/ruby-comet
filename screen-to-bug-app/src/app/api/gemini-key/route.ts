import { NextResponse } from "next/server";

// This route safely exposes only the Gemini API key to the client.
// The client uses it to call Gemini directly, bypassing Vercel timeout limits.
export async function GET() {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }
    return NextResponse.json({ key });
}
