"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Save, ShieldCheck, AlertCircle, ExternalLink, Github } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function GitHubSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [config, setConfig] = useState({
        owner: "",
        repo: "",
        pat: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        if (!supabase) return;
        try {
            const { data } = await supabase
                .from("github_config")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setConfig({
                    owner: data.owner,
                    repo: data.repo,
                    pat: data.pat,
                });
            }
        } catch (err) {
            console.error("Error fetching GitHub config:", err);
        }
    };

    const [testing, setTesting] = useState(false);

    const handleTestConnection = async () => {
        setTesting(true);
        setStatus(null);
        try {
            const response = await fetch("/api/github/test-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setStatus({ type: "success", message: `Connected to: ${result.repoName}` });
        } catch (err: any) {
            setStatus({ type: "error", message: err.message || "Connection failed" });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        setStatus(null);

        try {
            const { data: firstRow } = await supabase.from("github_config").select("id").limit(1).single();

            const { error } = await supabase
                .from("github_config")
                .upsert({
                    id: firstRow?.id || undefined,
                    ...config,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setStatus({ type: "success", message: "GitHub configuration saved successfully!" });
            setTimeout(() => setIsOpen(false), 2000);
        } catch (err: any) {
            setStatus({ type: "error", message: err.message || "Failed to save configuration" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all text-sm font-medium cursor-pointer"
            >
                <Github size={16} />
                GitHub Settings
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="github-settings-title"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-[101] w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-500/10 rounded-lg border border-slate-500/20">
                                        <Github size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 id="github-settings-title" className="text-lg font-semibold text-white">GitHub Configuration</h2>
                                        <p className="text-xs text-slate-400">Export bug reports to GitHub Issues</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="github-owner" className="text-xs font-medium text-slate-400 uppercase tracking-wider">Owner</label>
                                        <input
                                            id="github-owner"
                                            type="text"
                                            required
                                            placeholder="username"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500/50 transition-all placeholder:text-slate-600"
                                            value={config.owner}
                                            onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="github-repo" className="text-xs font-medium text-slate-400 uppercase tracking-wider">Repo</label>
                                        <input
                                            id="github-repo"
                                            type="text"
                                            required
                                            placeholder="repo-name"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500/50 transition-all placeholder:text-slate-600"
                                            value={config.repo}
                                            onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="github-pat" className="text-xs font-medium text-slate-400 uppercase tracking-wider">Access Token (PAT)</label>
                                        <a
                                            href="https://github.com/settings/tokens"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            Create PAT <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <input
                                        id="github-pat"
                                        type="password"
                                        required
                                        placeholder="ghp_..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500/50 transition-all placeholder:text-slate-600 font-mono"
                                        value={config.pat}
                                        onChange={(e) => setConfig({ ...config, pat: e.target.value })}
                                    />
                                    <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] text-slate-400 leading-relaxed">
                                        <strong>Required Permissions:</strong><br />
                                        • Classic PAT: <code>repo</code> scope<br />
                                        • Fine-grained: <strong>Issues</strong> (Read & Write)
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    {status && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                }`}
                                        >
                                            {status.type === "success" ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                                            {status.message}
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={handleTestConnection}
                                            disabled={testing || !config.owner || !config.repo || !config.pat}
                                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                        >
                                            {testing ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                "Test Connection"
                                            )}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Save size={18} />
                                                    Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
