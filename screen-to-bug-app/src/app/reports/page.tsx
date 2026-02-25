"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface BugReport {
  id: string;
  title: string | null;
  severity: string | null;
  created_at: string;
  recording: {
    status: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("bug_reports")
        .select(`
          id,
          title,
          severity,
          created_at,
          recording:recordings(status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data as any) || []);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_ai": return "Analyzing Video...";
      case "ai_complete": return "Draft";
      case "report_finalized": return "Finalized";
      default: return status;
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "major": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "minor": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Bug Reports</h1>
            <p className="text-zinc-400">Manage and review your AI-generated documentation.</p>
          </div>
          <Link
            href="/record"
            className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 text-center"
          >
            New Recording
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-zinc-900/50 border border-zinc-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-16 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-xl font-bold mb-2">No reports yet</h3>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto text-sm">
              Your generated bug reports will appear here once you record your first bug.
            </p>
            <Link
              href="/record"
              className="inline-block px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
            >
              Start Testing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="group bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all backdrop-blur-sm"
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${getSeverityColor(report.severity)}`}>
                        {report.severity || "Unknown"}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 flex items-center gap-2">
                      {report.title || "Untitled Bug Report"}
                      {report.recording && (
                        <span className="text-zinc-500 animate-pulse text-sm">📹</span>
                      )}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <span className="text-xs font-medium text-zinc-500">
                      Status: <span className="text-zinc-300">{getStatusLabel((report.recording as any)?.status)}</span>
                    </span>
                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      View Report →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
