"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Save, ShieldCheck, AlertCircle, ExternalLink, Activity } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AzureDevOpsSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [config, setConfig] = useState({
        org_url: "",
        project_name: "",
        pat: "",
    });

    const [customFields, setCustomFields] = useState<{ id: string; key: string; value: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from("ado_config")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setConfig({
                    org_url: data.org_url,
                    project_name: data.project_name,
                    pat: data.pat,
                });

                // Parse existing custom fields if they exist
                if (data.custom_fields) {
                    const fields = Object.entries(data.custom_fields).map(([k, v]) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        key: k,
                        value: String(v)
                    }));
                    setCustomFields(fields);
                }
            }
        } catch (err) {
            console.error("Error fetching ADO config:", err);
        }
    };

    const handleAddField = () => {
        setCustomFields([...customFields, { id: Math.random().toString(36).substr(2, 9), key: "", value: "" }]);
    };

    const handleRemoveField = (id: string) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    const handleFieldChange = (id: string, field: "key" | "value", val: string) => {
        setCustomFields(customFields.map(f => f.id === id ? { ...f, [field]: val } : f));
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setStatus(null);
        try {
            const response = await fetch("/api/ado/test-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setStatus({ type: "success", message: `Connected to ADO Project: ${result.projectName}` });
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

        // Convert array back to object for JSONB storage
        const customFieldsObj = customFields.reduce((acc, curr) => {
            if (curr.key && curr.value) {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {} as Record<string, string>);

        try {
            const { data: firstRow } = await supabase.from("ado_config").select("id").limit(1).single();

            const { error } = await supabase
                .from("ado_config")
                .upsert({
                    id: firstRow?.id || undefined,
                    ...config,
                    custom_fields: customFieldsObj,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setStatus({ type: "success", message: "Azure DevOps configuration saved!" });
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
                <Activity size={16} />
                ADO Settings
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
                                    <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                                        <Activity className="text-sky-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Azure DevOps</h2>
                                        <p className="text-xs text-slate-400">Connect to ADO Boards</p>
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
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Organization URL</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="https://dev.azure.com/your-org"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-600"
                                        value={config.org_url}
                                        onChange={(e) => setConfig({ ...config, org_url: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="MyProject"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-600"
                                        value={config.project_name}
                                        onChange={(e) => setConfig({ ...config, project_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Personal Access Token (PAT)</label>
                                        <a
                                            href="https://dev.azure.com/_usersSettings/tokens"
                                            target="_blank"
                                            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                                        >
                                            Create PAT <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter Azure DevOps PAT"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-600 font-mono"
                                        value={config.pat}
                                        onChange={(e) => setConfig({ ...config, pat: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Required Fields (ADO Rules)</label>
                                        <button
                                            type="button"
                                            onClick={handleAddField}
                                            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            + Add Field
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                        {customFields.length === 0 && (
                                            <p className="text-[10px] text-zinc-600 italic">No custom fields added</p>
                                        )}
                                        {customFields.map((field) => (
                                            <div key={field.id} className="flex gap-2">
                                                <input
                                                    placeholder="Field Key"
                                                    value={field.key}
                                                    onChange={(e) => handleFieldChange(field.id, "key", e.target.value)}
                                                    className="grow-0 w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-sky-500/50"
                                                />
                                                <input
                                                    placeholder="Value"
                                                    value={field.value}
                                                    onChange={(e) => handleFieldChange(field.id, "value", e.target.value)}
                                                    className="grow bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-sky-500/50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveField(field.id)}
                                                    className="p-1.5 text-zinc-600 hover:text-red-400"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
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
                                            disabled={testing || !config.org_url || !config.pat}
                                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            {testing ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                "Test"
                                            )}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
