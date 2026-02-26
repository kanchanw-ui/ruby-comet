import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Saves an AI-generated bug report from the client. Used after client-side
 * Gemini processing to avoid Vercel serverless timeout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId, title, raw_markdown, severity } = body;

    if (!recordingId || !raw_markdown) {
      return NextResponse.json(
        { error: "recordingId and raw_markdown are required" },
        { status: 400 }
      );
    }

    // Update recording status to ai_complete (processing done)
    await supabase
      .from("recordings")
      .update({ status: "ai_complete" })
      .eq("id", recordingId);

    const { data: bugReport, error: bugReportError } = await supabase
      .from("bug_reports")
      .insert({
        recording_id: recordingId,
        title: title || "Untitled Bug Report",
        raw_markdown,
        severity: severity || "Minor",
      })
      .select()
      .single();

    if (bugReportError) {
      console.error("Bug report insert error:", bugReportError);
      return NextResponse.json(
        { error: "Failed to create bug report", details: String(bugReportError) },
        { status: 500 }
      );
    }

    // Update recording status to report_finalized
    await supabase
      .from("recordings")
      .update({ status: "report_finalized" })
      .eq("id", recordingId);

    return NextResponse.json({ bugReport });
  } catch (error) {
    console.error("save-bug-report error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
