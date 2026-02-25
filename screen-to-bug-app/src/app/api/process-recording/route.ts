import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function POST(request: NextRequest) {
  console.log("Starting recording process...");
  try {
    const { recordingId } = await request.json();
    console.log("Processing recording ID:", recordingId);

    if (!recordingId) {
      return NextResponse.json(
        { error: "recordingId is required" },
        { status: 400 }
      );
    }

    // Fetch recording metadata
    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

    if (recordingError || !recording) {
      console.error("Recording not found in DB:", recordingError);
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    console.log("Recording metadata found:", recording.storage_path);

    // Update status to processing
    await supabase
      .from("recordings")
      .update({ status: "ai_complete" })
      .eq("id", recordingId);

    // Download video from Supabase Storage
    console.log("Downloading video from storage...");
    const { data: videoData, error: downloadError } = await supabase.storage
      .from("recordings")
      .download(recording.storage_path);

    if (downloadError || !videoData) {
      console.error("Storage download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download recording" },
        { status: 500 }
      );
    }

    console.log("Video downloaded, size:", videoData.size);

    // Convert blob to base64 for Gemini
    const arrayBuffer = await videoData.arrayBuffer();
    const base64Video = Buffer.from(arrayBuffer).toString("base64");

    // Call Gemini 2.5 Flash
    console.log("Calling Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this screen recording video and generate a structured bug report in markdown format.

Please extract:
1. **Steps to Reproduce**: An ordered list of the key user interactions shown in the video that lead to the issue.
2. **Actual Result**: Use a minimal bulleted list to describe what actually happened (error messages, visual glitches, unexpected behavior).
3. **Expected Result**: Use a minimal bulleted list to describe what should have happened.
4. **Visual Symptoms**: Any error dialogs, UI glitches, crashes, or other visual indicators of the problem.
5. **Severity**: Classify as "Critical", "Major", or "Minor" with a brief justification.

Format your response as markdown with clear sections. Keep the Actual and Expected results extremely concise.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Video,
          mimeType: "video/webm",
        },
      },
    ]);

    const response = await result.response;
    const markdown = response.text();
    console.log("Gemini response received. Markdown length:", markdown.length);

    // Extract severity
    let severity = "Minor";
    const severityMatch = markdown.match(/severity[:\s]+(Critical|Major|Minor)/i);
    if (severityMatch) {
      severity = severityMatch[1];
    }

    // Create bug report
    console.log("Saving bug report to DB...");
    const { data: bugReport, error: bugReportError } = await supabase
      .from("bug_reports")
      .insert({
        recording_id: recordingId,
        title: recording.title || "Untitled Bug Report",
        raw_markdown: markdown,
        severity: severity,
      })
      .select()
      .single();

    if (bugReportError) {
      console.error("Bug report insert error:", bugReportError);
      return NextResponse.json(
        { error: "Failed to create bug report" },
        { status: 500 }
      );
    }

    console.log("Bug report created successfully:", bugReport.id);

    // Update recording status
    await supabase
      .from("recordings")
      .update({ status: "report_finalized" })
      .eq("id", recordingId);

    return NextResponse.json({ bugReport });
  } catch (error) {
    console.error("Crucial error in processing pipeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
