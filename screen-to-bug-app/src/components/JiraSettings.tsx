"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Save, ShieldCheck, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function JiraSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [config, setConfig] = useState({
        domain: "",
        project_key: "",
        email: "",
        issue_type: "Bug",
        api_token: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from("jira_config")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setConfig({
                    domain: data.domain,
                    project_key: data.project_key,
                    email: data.email,
                    issue_type: data.issue_type || "Bug",
                    api_token: data.api_token,
                });
            }
        } catch (err) {
            console.error("Error fetching Jira config:", err);
        }
    };

    const [testing, setTesting] = useState(false);

    const handleTestConnection = async () => {
        setTesting(true);
        setStatus(null);
        try {
            const response = await fetch("/api/jira/test-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setStatus({ type: "success", message: `Connected to project: ${result.projectName}` });
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
            // For simplicity in this prototype, we just insert a new row or update the first one
            const { data: firstRow } = await supabase.from("jira_config").select("id").limit(1).single();

            const { error } = await supabase
                .from("jira_config")
                .upsert({
                    id: firstRow?.id || undefined,
                    ...config,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setStatus({ type: "success", message: "Jira configuration saved successfully!" });
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
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all text-sm font-medium"
            >
                <Settings size={16} />
                Jira Settings
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <Settings className="text-blue-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Jira Configuration</h2>
                                        <p className="text-xs text-slate-400">Connect Screen-to-Bug to your Jira project</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Jira Domain</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="your-company.atlassian.net"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                        value={config.domain}
                                        onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Key</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="BUG"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                            value={config.project_key}
                                            onChange={(e) => setConfig({ ...config, project_key: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Issue Type</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Bug"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                            value={config.issue_type}
                                            onChange={(e) => setConfig({ ...config, issue_type: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                        value={config.email}
                                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">API Token</label>
                                        <a
                                            href="https://id.atlassian.com/manage-profile/security/api-tokens"
                                            target="_blank"
                                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                        >
                                            Create Token <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter Atlassian API Token"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600 font-mono"
                                        value={config.api_token}
                                        onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
                                    />
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
                                            disabled={testing || !config.domain || !config.api_token}
                                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
