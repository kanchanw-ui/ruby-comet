"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";

const isSupabaseConfigured = () => !!supabase;

const GEMINI_PROMPT = `Analyze this screen recording video and generate a structured bug report in markdown format.

Please extract:
1. **Steps to Reproduce**: An ordered list of the key user interactions shown in the video that lead to the issue.
2. **Actual Result**: Use a minimal bulleted list to describe what actually happened (error messages, visual glitches, unexpected behavior).
3. **Expected Result**: Use a minimal bulleted list to describe what should have happened.
4. **Visual Symptoms**: Any error dialogs, UI glitches, crashes, or other visual indicators of the problem.
5. **Severity**: Classify as "Critical", "Major", or "Minor" with a brief justification.

Format your response as markdown with clear sections. Keep the Actual and Expected results extremely concise.`;

const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MAX_RECORDING_DURATION_MS);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await uploadRecording(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setIsRecording(true);
      setTimeRemaining(MAX_RECORDING_DURATION_MS);
      startTimeRef.current = Date.now();

      // Update timer every second
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, MAX_RECORDING_DURATION_MS - elapsed);
          setTimeRemaining(remaining);

          if (remaining === 0) {
            stopRecording();
          }
        }
      }, 1000);

      // Handle user stopping screen share
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      setUploadStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
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

  const uploadRecording = async (blob: Blob) => {
    if (!supabase) {
      setUploadStatus("error");
      return;
    }
    setUploadStatus("uploading");

    try {
      const fileName = `recording-${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, blob, {
          contentType: "video/webm",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Create recordings row
      const { data: recordingData, error: dbError } = await supabase
        .from("recordings")
        .insert({
          title: recordingTitle || null,
          storage_path: filePath,
          status: "pending_ai",
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setRecordingId(recordingData.id);
      setUploadStatus("processing");
      setProcessingError(null);
      setRecordingTitle("");

      // Run Gemini in the browser to avoid Vercel serverless timeout
      try {
        await processRecordingInBrowser(blob, recordingData);
        setUploadStatus("success");
      } catch (err) {
        console.error("Error generating bug report:", err);
        setProcessingError(err instanceof Error ? err.message : String(err));
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      setUploadStatus("error");
    }
  };

  /** Run Gemini in the browser so Vercel does not timeout during long video analysis. */
  async function processRecordingInBrowser(
    blob: Blob,
    recording: { id: string; title: string | null; storage_path: string }
  ) {
    const keyRes = await fetch("/api/gemini-key");
    if (!keyRes.ok) {
      const j = await keyRes.json().catch(() => ({}));
      throw new Error(j.error || "Failed to get Gemini API key");
    }
    const { key } = await keyRes.json();
    if (!key) throw new Error("Gemini API key not configured");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Use inline base64 in the browser (no File API / Node APIs)
    const base64 = await blobToBase64(blob);

    const result = await model.generateContent([
      GEMINI_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType: "video/webm",
        },
      },
    ]);

    const response = result.response;
    const markdown = response.text();

    let severity = "Minor";
    const severityMatch = markdown.match(/severity[:\s]+(Critical|Major|Minor)/i);
    if (severityMatch) severity = severityMatch[1];

    const videoPublicUrl = supabase!.storage
      .from("recordings")
      .getPublicUrl(recording.storage_path).data.publicUrl;
    const finalMarkdown = `${markdown}\n\n---\n### 📹 Attachment: Screen Recording\n[▶ View Original Recording](${videoPublicUrl})`;

    const saveRes = await fetch("/api/save-bug-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingId: recording.id,
        title: recording.title || "Untitled Bug Report",
        raw_markdown: finalMarkdown,
        severity,
      }),
    });

    if (!saveRes.ok) {
      const j = await saveRes.json().catch(() => ({}));
      throw new Error(j.error || "Failed to save bug report");
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        if (base64) resolve(base64);
        else reject(new Error("Failed to read video as base64"));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-semibold mb-8 text-black dark:text-zinc-50">
          Screen Recording
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 space-y-6">
          {!isSupabaseConfigured() && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200 text-sm">
              <p className="font-medium">Supabase not configured</p>
              <p className="mt-1">
                Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> in{" "}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">screen-to-bug-app</code>, then restart the dev server.
              </p>
            </div>
          )}
          {!isRecording && uploadStatus === "idle" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Recording Title (Optional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="e.g., Login bug reproduction"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                />
              </div>

              <button
                onClick={startRecording}
                disabled={!isSupabaseConfigured()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                Start Recording
              </button>
            </div>
          )}

          {isRecording && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-red-600 dark:text-red-500 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Recording in progress...
                </p>
              </div>

              <button
                onClick={stopRecording}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                Stop Recording
              </button>
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">
                Uploading recording...
              </p>
            </div>
          )}

          {uploadStatus === "processing" && (
            <div className="text-center py-8 space-y-2">
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                Generating bug report...
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                AI is analyzing your video. This may take a minute. Do not close this page.
              </p>
            </div>
          )}

          {uploadStatus === "success" && recordingId && (
            <div className="text-center py-8 space-y-4">
              <p className="text-green-600 dark:text-green-500 font-medium">
                Recording uploaded successfully!
              </p>
              <div className="space-y-2">
                <Link
                  href="/reports"
                  className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  View Reports
                </Link>
                <button
                  onClick={() => {
                    setUploadStatus("idle");
                    setRecordingId(null);
                  }}
                  className="w-full px-6 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Record Another
                </button>
              </div>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="text-center py-8 space-y-4">
              <p className="text-red-600 dark:text-red-500 font-medium">
                {processingError || "Error uploading recording. Please try again."}
              </p>
              <button
                onClick={() => {
                  setUploadStatus("idle");
                  setRecordingId(null);
                  setProcessingError(null);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
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
