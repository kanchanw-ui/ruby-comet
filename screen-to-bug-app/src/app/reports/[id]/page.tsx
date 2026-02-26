"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface BugReport {
  id: string;
  title: string | null;
  raw_markdown: string;
  severity: string | null;
  created_at: string;
  updated_at: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSeverity, setEditedSeverity] = useState("");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) throw error;
      if (data) {
        setReport(data);
        setEditedTitle(data.title || "");
        setEditedSeverity(data.severity || "");
        setEditedMarkdown(data.raw_markdown || "");
      }
    } catch (error) {
      console.error("Error loading report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bug_reports")
        .update({
          title: editedTitle || null,
          severity: editedSeverity || null,
          raw_markdown: editedMarkdown,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
      await loadReport();
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    const exportMarkdown = `# ${editedTitle || "Bug Report"}

**Severity:** ${editedSeverity || "Not specified"}

${editedMarkdown}

---
*Generated from screen recording*`;

    navigator.clipboard.writeText(exportMarkdown).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-400">Report not found.</p>
          <Link
            href="/reports"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/reports"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Back to Reports
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              />
            </div>

            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Severity
              </label>
              <select
                id="severity"
                value={editedSeverity}
                onChange={(e) => setEditedSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              >
                <option value="">Not specified</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="markdown"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Report Content (Markdown)
              </label>
              <textarea
                id="markdown"
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                rows={20}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-md hover:shadow-lg disabled:shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {copySuccess ? "✓ Copied!" : "Copy to Jira/GitHub"}
            </button>
            <div className="flex-1 text-right text-sm text-zinc-600 dark:text-zinc-400">
              Created: {new Date(report.created_at).toLocaleString()}
              {report.updated_at !== report.created_at && (
                <span className="ml-4">
                  Updated: {new Date(report.updated_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
