"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

const isSupabaseConfigured = () => !!supabase;

const MAX_RECORDING_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MAX_RECORDING_DURATION_MS);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [recordingId, setRecordingId] = useState<string | null>(null);

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

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(filePath, blob, {
          contentType: "video/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: recordingData, error: dbError } = await supabase
        .from("recordings")
        .insert({
          title: recordingTitle || null,
          storage_path: filePath,
          status: "pending_ai",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setRecordingId(recordingData.id);
      setUploadStatus("success");
      setRecordingTitle("");

      fetch("/api/process-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId: recordingData.id }),
      }).catch((err) => console.error("AI trigger error:", err));
    } catch (error) {
      console.error("Upload error:", error);
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
          <Link
            href="/"
            className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Screen Recording</h1>
          <p className="text-zinc-400">
            Share your screen and perform the actions that lead to the bug.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          {!isSupabaseConfigured() && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              <p className="font-semibold mb-1">Configuration Required</p>
              <p className="opacity-80">
                Please set up your Supabase environment variables to enable uploads.
              </p>
            </div>
          )}

          {!isRecording && uploadStatus === "idle" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  What are you testing?
                </label>
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

              <p className="text-center text-xs text-zinc-500">
                Max duration: 5 minutes. No audio will be recorded.
              </p>
            </div>
          )}

          {isRecording && (
            <div className="text-center py-8 space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
                <div className="relative text-6xl font-mono font-bold text-red-500 tracking-tighter">
                  {formatTime(timeRemaining)}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-zinc-400 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Live Recording</span>
              </div>

              <button
                onClick={stopRecording}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                Stop & Process
              </button>
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-400 animate-pulse">Uploading to cloud...</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Recording Captured!</h3>
                <p className="text-zinc-400 text-sm">
                  Our AI is analyzing the video to generate your report.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/reports"
                  className="py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all"
                >
                  View Reports
                </Link>
                <button
                  onClick={() => setUploadStatus("idle")}
                  className="py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  New Record
                </button>
              </div>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                !
              </div>
              <p className="text-red-400 font-medium">Upload failed. Please try again.</p>
              <button
                onClick={() => setUploadStatus("idle")}
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
