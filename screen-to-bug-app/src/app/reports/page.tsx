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
        .select(
          `
          id,
          title,
          severity,
          created_at,
          recording:recordings(status)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((row) => ({
        ...row,
        recording: Array.isArray(row.recording)
          ? row.recording[0] ?? { status: "unknown" }
          : row.recording ?? { status: "unknown" },
      }));
      setReports(normalized as BugReport[]);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_ai":
        return "Processing";
      case "ai_complete":
        return "Draft";
      case "report_finalized":
        return "Finalized";
      default:
        return status;
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Bug Reports
          </h1>
          <Link
            href="/record"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            New Recording
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No bug reports yet.
            </p>
            <Link
              href="/record"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Create Your First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="block bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
                      {report.title || "Untitled Bug Report"}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {report.severity && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                          report.severity
                        )}`}
                      >
                        {report.severity}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {getStatusLabel(report.recording?.status ?? "unknown")}
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
