
'use client';

import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Scale, FileText, Download, 
    Search, UserCheck, AlertCircle, History,
    Fingerprint, Globe, Shield, Key,
    ExternalLink, CheckCircle2, Loader2, Mail,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getComplianceLogsAction, 
    exportUserGDPRDataAction, 
    getPolicyAction, 
    updatePolicyAction,
    getPolicyHistoryAction,
    PolicyType 
} from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

interface ComplianceLog {
    userId: string;
    userName: string;
    email: string;
    acceptedAt: string;
    termsVersion: string;
}

export default function ComplianceAdminPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<ComplianceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState(false);
    const [exportResult, setExportResult] = useState<any | null>(null);

    // Terms stuff
    const [currentPolicy, setCurrentPolicy] = useState<{ content: string, version: string, updatedAt: string }>({
        content: '',
        version: '',
        updatedAt: ''
    });
    const [isSavingTerms, setIsSavingTerms] = useState(false);
    const [activePolicyType, setActivePolicyType] = useState<PolicyType>('terms');
    const [policyHistory, setPolicyHistory] = useState<any[]>([]);

    const fetchLogs = React.useCallback(async () => {
        const result = await getComplianceLogsAction();
        if (result.success && result.data) {
            setLogs(result.data);
        }
        setLoading(false);
    }, []);

    const fetchPolicy = React.useCallback(async (type: PolicyType) => {
        const termsResult = await getPolicyAction(type);
        if (termsResult.success && termsResult.data) {
            setCurrentPolicy({
                content: termsResult.data.content || '',
                version: termsResult.data.version || '',
                updatedAt: termsResult.data.updatedAt || ''
            });
        }
        
        // Fetch history
        const historyResult = await getPolicyHistoryAction(type);
        if (historyResult.success && historyResult.data) {
            setPolicyHistory(historyResult.data);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        fetchPolicy(activePolicyType);
    }, [activePolicyType]);

    const handleGdprExport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setExporting(true);
        setExportResult(null);

        try {
            const result = await exportUserGDPRDataAction(searchQuery);
            if (result.success && result.data) {
                setExportResult(result.data);
                toast({ title: 'GDPR Data ekstrapoleret!', description: 'Fullstændig bruger-dump klar til download.' });
            } else {
                toast({ variant: 'destructive', title: 'Bruger ikke fundet', description: result.message || 'Tjek venligst email eller bruger-ID.' });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Fejl ved eksport', description: error.message });
        } finally {
            setExporting(false);
        }
    };

    const downloadExport = () => {
        if (!exportResult) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportResult, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `gdpr_export_${exportResult.metadata.userId}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleSaveTerms = async () => {
        setIsSavingTerms(true);
        const result = await updatePolicyAction(activePolicyType, currentPolicy.content);
        if (result.success) {
            toast({ title: 'Politik opdateret!', description: `Ny version for ${activePolicyType}: ${result.version}` });
            setCurrentPolicy(prev => ({ ...prev, version: result.version || '' }));
            fetchPolicy(activePolicyType); // Refresh history
        }
        setIsSavingTerms(false);
    };

    const handleRestoreVersion = (content: string, version: string) => {
        setCurrentPolicy(prev => ({ ...prev, content }));
        toast({ title: 'Kladde gendannet', description: `Du ser nu indholdet fra version ${version}. Husk at gemme for at udgive det.` });
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20 pt-8 px-4">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100 shadow-sm shadow-indigo-500/5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Compliance & Legal Intelligence
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">Juridisk Overblik</h1>
                    <p className="text-xl text-slate-500 font-medium italic">Monitorering af brugeraccept, GDPR data-eksport og audit-ready logning.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-10 p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">GDPR Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-sm font-black text-white uppercase tracking-tighter">Audit Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* GDPR Export Tool */}
                <div className="xl:col-span-4">
                    <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5 shadow-inner">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black serif">GDPR Data-ekstraktion</h3>
                                <p className="text-sm text-white/40 leading-relaxed italic">
                                    Brug dette værktøj til at generere en komplet data-dump for en specifik bruger. Påkrævet ved "Indsigtsbegæringer".
                                </p>
                            </div>

                            <form onSubmit={handleGdprExport} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/30 px-2 tracking-widest">Bruger E-mail eller ID</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="sk@cohero.dk"
                                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 font-bold text-white text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={exporting || !searchQuery}
                                    className="w-full h-16 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {exporting ? 'Extrapolating...' : 'Generér Data-fil'}
                                </button>
                            </form>

                            <AnimatePresence>
                                {exportResult && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Klar til download</p>
                                                <p className="text-sm font-bold text-white truncate max-w-[200px]">{exportResult.profile.username}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={downloadExport}
                                            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                                        >
                                            Download JSON Rapport
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>

                {/* Acceptance Logs */}
                <div className="xl:col-span-8">
                    <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><History className="w-5 h-5" /></div>
                                <h3 className="text-2xl font-black text-slate-900 serif">Brugeraccept Log</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Seneste 100 samtykker</span>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-32 flex flex-col items-center gap-6">
                                    <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Henter compliance logs...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                            <th className="px-10 py-6">Bruger / Samtykke</th>
                                            <th className="px-10 py-6">Terms Version</th>
                                            <th className="px-10 py-6">Timestamp</th>
                                            <th className="px-10 py-6 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {logs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-slate-400">
                                                            {log.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 serif leading-none">{log.userName}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{log.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-bold">{log.termsVersion}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-xs font-bold text-slate-400">{log.acceptedAt ? new Date(log.acceptedAt).toLocaleString('da-DK') : 'N/A'}</p>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                                        <UserCheck className="w-3.5 h-3.5" /> Verified
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {/* Policy Editor */}
                <div className="xl:col-span-12">
                     <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><FileText className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 serif leading-none">
                                        {activePolicyType === 'terms' ? 'Handelsbetingelser' : activePolicyType === 'privacy' ? 'Privatlivspolitik' : 'Cookiepolitik'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Versio {currentPolicy.version} • Opdateret {currentPolicy.updatedAt ? new Date(currentPolicy.updatedAt).toLocaleDateString('da-DK') : 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                                {(['terms', 'privacy', 'cookies'] as PolicyType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActivePolicyType(type)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePolicyType === type ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type === 'terms' ? 'Handels' : type === 'privacy' ? 'Privatliv' : 'Cookies'}
                                    </button>
                                ))}
                            </div>

                            <a href={`/${activePolicyType === 'terms' ? 'terms-of-service' : activePolicyType === 'privacy' ? 'privacy-policy' : 'cookie-policy'}`} target="_blank" className="flex items-center gap-2 px-6 py-2 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                                Vis offentlig side <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                        <div className="p-10 grid grid-cols-1 xl:grid-cols-12 gap-10">
                            <div className="xl:col-span-8 space-y-6">
                                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Juridisk Indhold ({activePolicyType})</label>
                                <textarea 
                                    value={currentPolicy.content}
                                    onChange={e => setCurrentPolicy(prev => ({ ...prev, content: e.target.value }))}
                                    rows={20}
                                    placeholder={`Skriv ${activePolicyType} her...`}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 font-medium text-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all leading-relaxed"
                                />
                                <div className="flex justify-end pt-4">
                                    <button 
                                        onClick={handleSaveTerms}
                                        disabled={isSavingTerms}
                                        className="h-16 px-12 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 flex items-center justify-center gap-3"
                                    >
                                        {isSavingTerms ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} {isSavingTerms ? 'Updating...' : 'Gem & Udgiv Ny Version'}
                                    </button>
                                </div>
                            </div>

                            <div className="xl:col-span-4 bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col h-full min-h-[500px]">
                                <div className="p-8 border-b border-white flex items-center gap-3 bg-white/50 backdrop-blur">
                                    <History className="w-5 h-5 text-slate-900" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Historik & Gendannelse</h4>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[600px]">
                                    {policyHistory.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                            <History className="w-8 h-8 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Ingen historik fundet</p>
                                        </div>
                                    )}
                                    {policyHistory.map((item) => (
                                        <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-3xl group hover:border-slate-300 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black text-slate-600">v{item.version}</span>
                                                    <span className="text-[9px] font-black text-slate-400">
                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString('da-DK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleRestoreVersion(item.content, item.version)}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                                {item.content.substring(0, 100)}...
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
