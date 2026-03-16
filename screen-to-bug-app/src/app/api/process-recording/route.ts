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

const PROMPT = `You are analyzing a screen recording with optional voice narration to produce a single, coherent bug report. Combine what you SEE (user actions on screen) with what you HEAR (user's speech) into one structured report.

**Title**
- First line: **Title:** followed by one short sentence summarizing the bug (e.g. "Login fails with invalid credentials error"). This is required.

**Steps to Reproduce**
- Build an ordered list that merges (1) visible user actions (clicks, navigation, inputs) and (2) brief spoken context where relevant. Keep each step to one short line. Aim for 5-7 steps maximum; do not repeat the same idea. Prefer "Click X" or "Navigate to Y" plus a brief phrase; avoid long sentences or paragraphs. Fold speech into steps only when it clarifies the action in a few words.

**Expected Result**
- Use the user's speech to infer what they expect. When they say "this should be expected", "it should show X", "expected to see Y" — put that here as 1-3 bullet points. If not stated, one brief line.

**Actual Result**
- Use the user's speech for what is wrong. When they say "this is showing currently", "not expected", "incorrect", "here's the error" — put that here as 1-3 bullet points. Include visible errors. Be concise.

**Visual Symptoms**
- Any error dialogs, UI glitches, or crashes visible in the video. One or two lines.

**Severity**
- Classify as "Critical", "Major", or "Minor" with a brief justification.

Output only markdown with these exact section headers. Be concise. No separate "User voice notes" section.`;

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

    // Call Gemini 2.5 Flash with retry and fallback to 2.5 Flash-Lite on 429
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash-preview"] as const;
    const maxRetriesPerModel = 2;
    let markdown: string | null = null;
    let lastError: unknown;

    for (const modelId of modelsToTry) {
      const model = genAI.getGenerativeModel({ model: modelId });
      for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
        try {
          console.log("Calling Gemini API...", modelId, attempt + 1);
          const result = await model.generateContent([PROMPT, videoPart]);
          const response = await result.response;
          markdown = response.text();
          console.log("Gemini response received. Markdown length:", markdown.length);
          break;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const is429 = msg.includes("429") || msg.includes("quota") || msg.includes("rate");
          if (is429) {
            const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
            const delaySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 35;
            const delayMs = Math.min(delaySec * 1000, 60000);
            if (attempt < maxRetriesPerModel - 1) {
              console.log(`Quota/rate limit hit. Waiting ${delaySec}s before retry...`);
              await new Promise((r) => setTimeout(r, delayMs));
              continue;
            }
            if (modelId === modelsToTry[modelsToTry.length - 1]) {
              return NextResponse.json(
                {
                  error: "Gemini API quota exceeded. Please wait a few minutes and try again.",
                  details: "https://ai.google.dev/gemini-api/docs/rate-limits",
                },
                { status: 429 }
              );
            }
            break;
          }
          throw err;
        }
      }
      if (markdown) break;
    }

    if (!markdown) {
      console.error("All Gemini attempts failed:", lastError);
      return NextResponse.json(
        { error: "AI processing failed", details: String(lastError) },
        { status: 500 }
      );
    }

    // Extract severity
    let severity = "Minor";
    const severityMatch = markdown.match(/severity[:\s]+(Critical|Major|Minor)/i);
    if (severityMatch) {
      severity = severityMatch[1];
    }

    // Extract title from AI output (**Title:** ... or Title: ...)
    const titleMatch = markdown.match(/\*\*Title\*\*[:\s]*\n?\s*([^\n*]+?)(?=\n\n|\n\*\*|$)/i) || markdown.match(/^Title[:\s]+([^\n]+)/im);
    const aiTitle = titleMatch ? titleMatch[1].trim() : null;
    const reportTitle = recording.title || aiTitle || "Untitled Bug Report";

    // Append video link to the markdown
    const final_markdown = `${markdown}\n\n---\n### 📹 Attachment: Screen Recording\n[▶ View Original Recording](${videoPublicUrl})`;

    // Create bug report
    console.log("Saving bug report to DB...");
    const { data: bugReport, error: bugReportError } = await supabase
      .from("bug_reports")
      .insert({
        recording_id: recordingId,
        title: reportTitle,
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
