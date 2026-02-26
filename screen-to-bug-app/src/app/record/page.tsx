"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const isSupabaseConfigured = () => !!supabase;

const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const GEMINI_PROMPT = `Analyze this screen recording video and generate a structured bug report in markdown format.

Please extract:
1. **Steps to Reproduce**: An ordered list of the key user interactions shown in the video that lead to the issue.
2. **Actual Result**: Use a minimal bulleted list to describe what actually happened (error messages, visual glitches, unexpected behavior).
3. **Expected Result**: Use a minimal bulleted list to describe what should have happened.
4. **Visual Symptoms**: Any error dialogs, UI glitches, crashes, or other visual indicators of the problem.
5. **Severity**: Classify as "Critical", "Major", or "Minor" with a brief justification.

Format your response as markdown with clear sections. Keep the Actual and Expected results extremely concise.`;

type UploadStatus = "idle" | "uploading" | "uploading_to_ai" | "ai_processing" | "saving" | "success" | "error";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MAX_RECORDING_DURATION_MS);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await processRecording(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setTimeRemaining(MAX_RECORDING_DURATION_MS);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, MAX_RECORDING_DURATION_MS - elapsed);
          setTimeRemaining(remaining);
          if (remaining === 0) stopRecording();
        }
      }, 1000);

      stream.getVideoTracks()[0].addEventListener("ended", () => stopRecording());
    } catch (error) {
      console.error("Error starting recording:", error);
      setErrorMessage("Could not start recording. Please allow screen share.");
      setUploadStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    startTimeRef.current = null;
  };

  // ─── FULL CLIENT-SIDE PROCESSING PIPELINE ────────────────────────────────
  // This avoids Vercel's 10-60s serverless timeout entirely.
  // All AI work happens in the browser — no timeout limits.
  const processRecording = async (blob: Blob) => {
    if (!supabase) { setUploadStatus("error"); setErrorMessage("Supabase not configured."); return; }

    try {
      // STEP 1: Upload video to Supabase Storage
      setUploadStatus("uploading");
      setStatusMessage("Uploading recording to cloud…");

      const fileName = `recording-${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, blob, { contentType: "video/webm", upsert: false });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      // STEP 2: Create recording record in DB
      const { data: recordingData, error: dbError } = await supabase
        .from("recordings")
        .insert({ title: recordingTitle || null, storage_path: filePath, status: "pending_ai" })
        .select()
        .single();

      if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

      // Get public URL
      const { data: urlData } = supabase.storage.from("recordings").getPublicUrl(filePath);
      const videoUrl = urlData.publicUrl;

      // STEP 3: Get Gemini API key from secure server route
      const keyResp = await fetch("/api/gemini-key");
      if (!keyResp.ok) throw new Error("Could not fetch AI key");
      const { key: geminiKey } = await keyResp.json();

      // STEP 4: Convert recording to base64 for Gemini
      setUploadStatus("uploading_to_ai");
      setStatusMessage("Sending video to Gemini AI…");

      // Convert Blob to Base64
      const base64Video = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            const b64 = reader.result.split(",")[1];
            resolve(b64);
          } else {
            reject(new Error("Failed to read video blob as base64 string"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // STEP 5: Ask Gemini to generate the bug report using inlineData
      setUploadStatus("ai_processing");
      setStatusMessage("✨ AI is watching your recording…");

      const genResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: GEMINI_PROMPT },
                  { inlineData: { mimeType: "video/webm", data: base64Video } },
                ],
              },
            ],
          }),
        }
      );

      if (!genResp.ok) throw new Error(`Gemini generation failed: ${genResp.status}`);
      const genData = await genResp.json();
      const markdown: string = genData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!markdown) throw new Error("Gemini returned empty response");

      // Extract severity
      let severity = "Minor";
      const sev = markdown.match(/severity[:\s]+(Critical|Major|Minor)/i);
      if (sev) severity = sev[1];

      const finalMarkdown = `${markdown}\n\n---\n### 📹 Attachment: Screen Recording\n[▶ View Original Recording](${videoUrl})`;

      // STEP 7: Save bug report to Supabase
      setUploadStatus("saving");
      setStatusMessage("Saving your report…");

      const { data: bugReport, error: bugError } = await supabase
        .from("bug_reports")
        .insert({
          recording_id: recordingData.id,
          title: recordingTitle || "Untitled Bug Report",
          raw_markdown: finalMarkdown,
          severity,
        })
        .select()
        .single();

      if (bugError) throw new Error(`Report save failed: ${bugError.message}`);

      // Update recording status
      await supabase.from("recordings").update({ status: "report_finalized" }).eq("id", recordingData.id);

      setReportId(bugReport.id);
      setRecordingTitle("");
      setUploadStatus("success");
    } catch (err: any) {
      console.error("Processing error:", err);
      setErrorMessage(err.message || "An unexpected error occurred.");
      setUploadStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link href="/" className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Screen Recording</h1>
          <p className="text-zinc-400">Share your screen and perform the actions that lead to the bug.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          {!isSupabaseConfigured() && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              <p className="font-semibold mb-1">Configuration Required</p>
              <p className="opacity-80">Please set up your Supabase environment variables.</p>
            </div>
          )}

          {/* IDLE */}
          {!isRecording && uploadStatus === "idle" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">What are you testing?</label>
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="e.g., Checkout page crash"
                  className="w-full px-5 py-4 bg-black/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <button
                onClick={startRecording}
                disabled={!isSupabaseConfigured()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                Start Recording
              </button>
              <p className="text-center text-xs text-zinc-500">Max duration: 5 minutes. No audio will be recorded.</p>
            </div>
          )}

          {/* RECORDING */}
          {isRecording && (
            <div className="text-center py-8 space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
                <div className="relative text-6xl font-mono font-bold text-red-500 tracking-tighter">{formatTime(timeRemaining)}</div>
              </div>
              <div className="flex items-center justify-center gap-2 text-zinc-400 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Live Recording</span>
              </div>
              <button
                onClick={stopRecording}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                Stop &amp; Process
              </button>
            </div>
          )}

          {/* UPLOADING to Supabase */}
          {uploadStatus === "uploading" && (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-300 font-medium">{statusMessage}</p>
              <p className="text-zinc-600 text-xs">Step 1 of 4</p>
            </div>
          )}

          {/* UPLOADING to Gemini */}
          {uploadStatus === "uploading_to_ai" && (
            <div className="text-center py-16 space-y-5">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xl">📤</div>
              </div>
              <p className="text-zinc-300 font-medium">{statusMessage}</p>
              <p className="text-zinc-600 text-xs">Step 2 of 4 · This may take a moment for large recordings</p>
            </div>
          )}

          {/* AI PROCESSING */}
          {uploadStatus === "ai_processing" && (
            <div className="text-center py-16 space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
              </div>
              <div>
                <p className="text-white font-bold text-xl">{statusMessage}</p>
                <p className="text-zinc-400 text-sm mt-2">Gemini is analyzing every frame to find the bug</p>
                <p className="text-zinc-600 text-xs mt-3">⏱ Keep this tab open · Usually 30–60 seconds</p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                {["0ms", "150ms", "300ms"].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                    style={{ animationDelay: delay }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SAVING */}
          {uploadStatus === "saving" && (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-300 font-medium">{statusMessage}</p>
              <p className="text-zinc-600 text-xs">Step 4 of 4 · Almost done!</p>
            </div>
          )}

          {/* SUCCESS */}
          {uploadStatus === "success" && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-green-500/10">
                ✓
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Report Generated! 🎉</h3>
                <p className="text-zinc-400 text-sm">Your AI-powered bug report is ready to view.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {reportId ? (
                  <Link
                    href={`/reports/${reportId}`}
                    className="py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all text-center"
                  >
                    View Report →
                  </Link>
                ) : (
                  <Link
                    href="/reports"
                    className="py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all text-center"
                  >
                    View Reports
                  </Link>
                )}
                <button
                  onClick={() => { setUploadStatus("idle"); setErrorMessage(""); setReportId(null); }}
                  className="py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  New Recording
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {uploadStatus === "error" && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">!</div>
              <div>
                <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
                {errorMessage && (
                  <p className="text-zinc-500 text-xs font-mono bg-zinc-900 rounded-xl px-4 py-3 max-w-full overflow-auto text-left">
                    {errorMessage}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setUploadStatus("idle"); setErrorMessage(""); }}
                className="px-8 py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
