"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import JiraSettings from "@/components/JiraSettings";
import AzureDevOpsSettings from "@/components/AzureDevOpsSettings";
import GitHubSettings from "@/components/GitHubSettings";

interface BugReport {
  id: string;
  recording_id: string;
  title: string | null;
  raw_markdown: string;
  severity: string | null;
  jira_issue_key: string | null;
  ado_work_item_id: string | null;
  github_issue_number: number | null;
  github_repo_full_name: string | null;
  created_at: string;
  updated_at: string;
  recording?: {
    storage_path: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushingADO, setPushingADO] = useState(false);
  const [pushingGitHub, setPushingGitHub] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSeverity, setEditedSeverity] = useState("");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [jiraLink, setJiraLink] = useState<string | null>(null);
  const [adoLink, setAdoLink] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [githubLink, setGithubLink] = useState<string | null>(null);

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
        .select("*, recording:recordings(*)")
        .eq("id", reportId)
        .single();

      if (error) throw error;
      if (data) {
        setReport(data);
        setEditedTitle(data.title || "");
        setEditedSeverity(data.severity || "");
        setEditedMarkdown(data.raw_markdown || "");

        if (data.recording?.storage_path) {
          const { data: urlData } = supabase.storage
            .from("recordings")
            .getPublicUrl(data.recording.storage_path);
          setVideoUrl(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error("Error loading report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToJira = async () => {
    setPushing(true);
    try {
      const response = await fetch("/api/jira/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const result = await response.json();
      if (!response.ok) {
        let msg = result.error || "Failed to push to Jira";
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      setJiraLink(result.url);
      await loadReport();
    } catch (error: any) {
      console.error("Jira push error:", error);
      alert(error.message);
    } finally {
      setPushing(false);
    }
  };

  const handlePushToADO = async () => {
    setPushingADO(true);
    try {
      const response = await fetch("/api/ado/create-work-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to push to ADO");
        setAdoLink(result.url);
        await loadReport();
      } else {
        const text = await response.text();
        console.error("Non-JSON response from ADO API:", text);
        throw new Error(`Server returned non-JSON response (Status ${response.status}). Keep your dev console open for details.`);
      }
    } catch (error: any) {
      console.error("ADO push error:", error);
      alert(error.message);
    } finally {
      setPushingADO(false);
    }
  };

  const handlePushToGitHub = async () => {
    setPushingGitHub(true);
    try {
      const response = await fetch("/api/github/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to push to GitHub");

      setGithubLink(result.url);
      await loadReport();
    } catch (error: any) {
      console.error("GitHub push error:", error);
      alert(error.message);
    } finally {
      setPushingGitHub(false);
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
      alert("Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    const exportMarkdown = `# ${editedTitle || "Bug Report"}

**Severity:** ${editedSeverity || "Not specified"}

${editedMarkdown}

---
*Generated by Screen-to-Bug AI*`;

    navigator.clipboard.writeText(exportMarkdown).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-12 w-96 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-black text-white p-12 text-center">
        <p className="text-zinc-500 mb-4">Report not found.</p>
        <Link href="/reports" className="text-blue-500 hover:underline">Back to Reports</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/reports"
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ← Back to All Reports
          </Link>
          <div className="flex items-center gap-4">
            <JiraSettings />
            <AzureDevOpsSettings />
            <GitHubSettings />
            <div className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
              Last Sync: {new Date(report.updated_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {videoUrl && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl group">
                <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Recording Playback</span>
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                    Source: Supabase Cloud
                  </div>
                </div>
                <div className="aspect-video bg-black relative">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AI Analysis & Markdown</span>
                <span className="text-[10px] text-zinc-600 font-mono">UTF-8 Encoded</span>
              </div>
              <textarea
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                rows={25}
                className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-700"
                placeholder="AI is writing your report..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm sticky top-12">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Report Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Severity</label>
                  <select
                    value={editedSeverity}
                    onChange={(e) => setEditedSeverity(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors appearance-none"
                  >
                    <option value="">Not specified</option>
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                  >
                    {saving ? "Saving..." : "Save Report"}
                  </button>

                  <div className="pt-2 space-y-3">
                    {/* Jira Section */}
                    <button
                      onClick={handlePushToJira}
                      disabled={pushing || !!report.jira_issue_key}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {pushing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : report.jira_issue_key ? (
                        "✓ Pushed to Jira"
                      ) : (
                        "Push to Jira"
                      )}
                    </button>
                    {report.jira_issue_key && jiraLink && (
                      <a href={jiraLink} target="_blank" className="block text-center text-[10px] text-blue-400 hover:underline">
                        View {report.jira_issue_key} in Jira →
                      </a>
                    )}

                    {/* ADO Section */}
                    <button
                      onClick={handlePushToADO}
                      disabled={pushingADO || !!report.ado_work_item_id}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {pushingADO ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : report.ado_work_item_id ? (
                        "✓ Pushed to ADO"
                      ) : (
                        "Push to Azure DevOps"
                      )}
                    </button>
                    {report.ado_work_item_id && adoLink && (
                      <a href={adoLink} target="_blank" className="block text-center text-[10px] text-sky-400 hover:underline">
                        View ADO Work Item #{report.ado_work_item_id} →
                      </a>
                    )}

                    {/* GitHub Section */}
                    <button
                      onClick={handlePushToGitHub}
                      disabled={pushingGitHub || !!report.github_issue_number}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {pushingGitHub ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : report.github_issue_number ? (
                        "✓ Pushed to GitHub"
                      ) : (
                        "Push to GitHub"
                      )}
                    </button>
                    {report.github_issue_number && (
                      <a
                        href={githubLink || `https://github.com/${report.github_repo_full_name}/issues/${report.github_issue_number}`}
                        target="_blank"
                        className="block text-center text-slate-400 hover:underline text-[10px]"
                      >
                        View Issue #{report.github_issue_number} on GitHub →
                      </a>
                    )}

                    <div className="pt-4">
                      <button
                        onClick={handleCopyToClipboard}
                        className="w-full py-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                      >
                        {copySuccess ? "✓ Copied Markdown" : "Copy Markdown"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 text-[10px] text-zinc-600 text-center">
                  Report ID: {report.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
