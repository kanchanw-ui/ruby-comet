import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Vercel max function duration (seconds). 60 works on hobby, 300 on pro.
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const fileManager = new GoogleAIFileManager(geminiApiKey);

const PROMPT = `Analyze this screen recording video and generate a structured bug report in markdown format.

Please extract:
1. **Steps to Reproduce**: An ordered list of the key user interactions shown in the video that lead to the issue.
2. **Actual Result**: Use a minimal bulleted list to describe what actually happened (error messages, visual glitches, unexpected behavior).
3. **Expected Result**: Use a minimal bulleted list to describe what should have happened.
4. **Visual Symptoms**: Any error dialogs, UI glitches, crashes, or other visual indicators of the problem.
5. **Severity**: Classify as "Critical", "Major", or "Minor" with a brief justification.

Format your response as markdown with clear sections. Keep the Actual and Expected results extremely concise.`;

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

    // Update status to ai_complete (processing started)
    await supabase
      .from("recordings")
      .update({ status: "ai_complete" })
      .eq("id", recordingId);

    // Get public URL for the video in Supabase Storage
    const { data: urlData } = supabase.storage
      .from("recordings")
      .getPublicUrl(recording.storage_path);
    const videoPublicUrl = urlData.publicUrl;
    console.log("Video public URL:", videoPublicUrl);

    let videoPart: Part;

    try {
      // Strategy 1: Upload via URL to Gemini File API (preferred - avoids large base64 in memory)
      console.log("Fetching video to upload to Gemini File API...");
      const videoResponse = await fetch(videoPublicUrl);
      if (!videoResponse.ok) throw new Error(`Fetch failed: ${videoResponse.status}`);

      const videoBuffer = await videoResponse.arrayBuffer();
      const videoBlob = new Blob([videoBuffer], { type: "video/webm" });
      const videoFile = new File([videoBlob], "recording.webm", { type: "video/webm" });

      console.log("Uploading to Gemini File API, size:", videoBuffer.byteLength);
      const uploadResult = await fileManager.uploadFile(videoFile as any, {
        mimeType: "video/webm",
        displayName: `recording-${recordingId}`,
      });

      console.log("Gemini File API upload complete. URI:", uploadResult.file.uri);

      // Wait for file to be ACTIVE
      let file = uploadResult.file;
      let waitMs = 0;
      while (file.state === "PROCESSING" && waitMs < 30000) {
        await new Promise((r) => setTimeout(r, 2000));
        waitMs += 2000;
        file = await fileManager.getFile(file.name);
        console.log("File state:", file.state);
      }

      if (file.state !== "ACTIVE") {
        throw new Error(`File not active after wait. State: ${file.state}`);
      }

      videoPart = {
        fileData: {
          fileUri: file.uri,
          mimeType: "video/webm",
        },
      };
    } catch (fileApiError) {
      // Strategy 2: Fallback to inline base64 (smaller videos only)
      console.warn("File API failed, falling back to inline base64:", fileApiError);
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

      const arrayBuffer = await videoData.arrayBuffer();
      const base64Video = Buffer.from(arrayBuffer).toString("base64");
      console.log("Fallback base64 size:", base64Video.length);

      videoPart = {
        inlineData: {
          data: base64Video,
          mimeType: "video/webm",
        },
      };
    }

    // Call Gemini 1.5 Flash
    console.log("Calling Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([PROMPT, videoPart]);

    const response = await result.response;
    const markdown = response.text();
    console.log("Gemini response received. Markdown length:", markdown.length);

    // Extract severity
    let severity = "Minor";
    const severityMatch = markdown.match(/severity[:\s]+(Critical|Major|Minor)/i);
    if (severityMatch) {
      severity = severityMatch[1];
    }

    // Append video link to the markdown
    const final_markdown = `${markdown}\n\n---\n### 📹 Attachment: Screen Recording\n[▶ View Original Recording](${videoPublicUrl})`;

    // Create bug report
    console.log("Saving bug report to DB...");
    const { data: bugReport, error: bugReportError } = await supabase
      .from("bug_reports")
      .insert({
        recording_id: recordingId,
        title: recording.title || "Untitled Bug Report",
        raw_markdown: final_markdown,
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
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
