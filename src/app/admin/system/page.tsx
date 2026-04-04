
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, deleteDoc, doc, getDoc, setDoc, getDocs, writeBatch, where } from 'firebase/firestore';
import { Database, Loader2, AlertCircle, Trash2, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Palette, Layout, Gift, Bird, Ghost, Snowflake, RefreshCw, Layers, Shield, Cpu, Activity, Clock, Terminal, Zap, HardDrive, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface PageView extends DocumentData {
  id: string;
  userId: string;
  path: string;
  timestamp: { toDate: () => Date };
}

interface UserData {
  id: string;
  username: string;
}

interface EnrichedPageView extends PageView {
  username?: string;
}

interface SystemError extends DocumentData {
    id: string;
    title: string;
    description: string;
    path: string;
    userName: string;
    userEmail: string;
    timestamp: { toDate: () => Date };
    status: 'new' | 'resolved';
}

const AdminSystemPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Usage Limits States
    const [limitsSettings, setLimitsSettings] = useState<any>(null);
    const [isSavingLimits, setIsSavingLimits] = useState(false);
    
    // Theme States
    const [activeTheme, setActiveTheme] = useState<string>('default');
    const [isSavingTheme, setIsSavingTheme] = useState(false);

    // Migration State
    const [isMigrating, setIsMigrating] = useState(false);

    const pageViewsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'pageViews'), orderBy('timestamp', 'desc'), limit(200)) : null,
        [firestore]
    );
    const { data: pageViews, isLoading: pageViewsLoading } = useCollection<PageView>(pageViewsQuery);

    const usersQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'users')) : null,
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollection<UserData>(usersQuery);

    const errorsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'systemErrors'), orderBy('timestamp', 'desc'), limit(100)) : null,
        [firestore]
    );
    const { data: systemErrors, isLoading: errorsLoading } = useCollection<SystemError>(errorsQuery);

    const [enrichedPageViews, setEnrichedPageViews] = useState<EnrichedPageView[]>([]);
    const [showActivityLog, setShowActivityLog] = useState(true);

    useEffect(() => {
        if (pageViews && users) {
            const userMap = new Map(users.map(u => [u.id, u.username]));
            const enriched = pageViews.map(view => ({
                ...view,
                username: userMap.get(view.userId) || 'Ukendt Bruger'
            }));
            setEnrichedPageViews(enriched);
        }
    }, [pageViews, users]);

    useEffect(() => {
        const fetchLimits = async () => {
            if (!firestore) return;
            const docRef = doc(firestore, 'systemSettings', 'usageLimits');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLimitsSettings(docSnap.data());
            } else {
                setLimitsSettings({
                    Kollega: { concepts: 1, cases: 1, journal: 0, architect: 1, oralExam: 1, opinion: 0, star: 1, caseAnalyser: 0 },
                    'Kollega+': { concepts: -1, cases: -1, journal: -1, architect: -1, oralExam: -1, opinion: 10, star: -1, caseAnalyser: -1 }
                });
            }
            const themeRef = doc(firestore, 'systemSettings', 'activeTheme');
            const themeSnap = await getDoc(themeRef);
            if (themeSnap.exists()) setActiveTheme(themeSnap.data().theme || 'default');
        };
        fetchLimits();
    }, [firestore]);

    const handleSaveLimits = async () => {
        if (!firestore) return;
        setIsSavingLimits(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'usageLimits'), limitsSettings);
            toast({ title: 'Gateway Updated', description: 'Usage thresholds have been updated successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Update Failed' });
        } finally { setIsSavingLimits(false); }
    };

    const handleSaveTheme = async (theme: string) => {
        if (!firestore) return;
        setIsSavingTheme(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'activeTheme'), { theme });
            setActiveTheme(theme);
            toast({ title: 'Atmosphere Shifted', description: `Global theme set to ${theme}.` });
        } finally { setIsSavingTheme(false); }
    };

    const handleMigrateInstitutions = async () => {
        if (!firestore) return;
        if (!confirm('Execute global institution normalization?')) return;
        setIsMigrating(true);
        const MAPPING: Record<string, string> = { "UCL": "UCL Erhvervsakademi og Professionshøjskole", "Absalon": "Professionshøjskolen Absalon", "UCN": "Professionshøjskolen UCN" };
        try {
            const MAPPING_VALS = Object.keys(MAPPING);
            const usersRef = collection(firestore, 'users');
            const usersSnapshot = await getDocs(query(usersRef, where('institution', 'in', MAPPING_VALS)));
            let userCount = 0; const userBatch = writeBatch(firestore);
            usersSnapshot.forEach(doc => { const old = doc.data().institution; if (MAPPING[old]) { userBatch.update(doc.ref, { institution: MAPPING[old] }); userCount++; } });
            if (userCount > 0) await userBatch.commit();
            
            const currRef = collection(firestore, 'curriculums');
            const currSnapshot = await getDocs(query(currRef, where('institution', 'in', MAPPING_VALS)));
            let currCount = 0; const currBatch = writeBatch(firestore);
            currSnapshot.forEach(doc => { const old = doc.data().institution; if (MAPPING[old]) { currBatch.update(doc.ref, { institution: MAPPING[old] }); currCount++; } });
            if (currCount > 0) await currBatch.commit();

            toast({ title: 'Migration Complete', description: `${userCount} profiles and ${currCount} curricula normalized.` });
        } finally { setIsMigrating(false); }
    };

    const updateLimitValue = (tier: string, feature: string, value: string) => {
        const numValue = parseInt(value);
        setLimitsSettings((prev: any) => ({ ...prev, [tier]: { ...prev[tier], [feature]: isNaN(numValue) ? 0 : numValue } }));
    };

    const handleDeleteError = async (id: string) => {
        if (!firestore || !confirm('Permanently wipe error trace?')) return;
        await deleteDoc(doc(firestore, 'systemErrors', id));
        toast({ title: 'Trace Purged' });
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            {/* Header & Connectivity Stats */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-2">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 serif mb-2">Core Infrastructure</h1>
                   <p className="text-slate-500 font-medium">Global konfiguration, server-sundhed og database-administration.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Database', val: 'Online', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: 'Auth Gateway', val: 'Secure', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Compute', val: 'Optimized', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
                        { label: 'Latency', val: '24ms', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                    ].map((s, i) => (
                        <div key={i} className={`px-5 py-4 rounded-[1.5rem] border ${s.bg} flex items-center gap-3`}>
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{s.label}</p>
                                <p className={`text-xs font-black uppercase tracking-tight ${s.color}`}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            {/* Maintenance & Migration */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-12">
                    <section className="bg-slate-900 rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-64 -mt-64"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -ml-64 -mb-64 font-black"></div>
                        
                        <div className="relative z-10 p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="space-y-6 max-w-2xl">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/30">
                                   <Terminal className="w-3.5 h-3.5" /> Maintenance Protocol
                                </div>
                                <h3 className="text-4xl font-black text-white serif leading-tight">Data Normalization & Global State Migration</h3>
                                <p className="text-lg text-white/50 font-medium leading-relaxed">Udfør kritiske database-opgaver, institutions-synkronisering og metadata-rensning på tværs af hele platformen.</p>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button 
                                        onClick={handleMigrateInstitutions}
                                        disabled={isMigrating}
                                        className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-indigo-50"
                                    >
                                        {isMigrating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />} {isMigrating ? 'Propagating...' : 'Sync Institutions'}
                                    </button>
                                    <button disabled className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-white/5 text-white/20 border border-white/10 rounded-[2rem] font-black uppercase text-[11px] tracking-widest cursor-not-allowed">
                                        <HardDrive className="w-5 h-5" /> Cleanup Orphan Docs
                                    </button>
                                </div>
                            </div>
                            <div className="shrink-0 w-full lg:w-auto">
                                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                            <Zap className="w-6 h-6 fill-current" />
                                        </div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest italic">System Vitality: 100%</p>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'UCL Erhvervsakademi', val: 'Optimized' },
                                            { label: 'Absalon Professionshøjskole', val: 'Synchronized' },
                                            { label: 'UCN Professionshøjskole', val: 'Ready' },
                                        ].map((m, i) => (
                                            <div key={i} className="flex items-center justify-between gap-12 border-b border-white/5 pb-2">
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{m.label}</span>
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{m.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Usage Limits */}
                <div className="xl:col-span-8 space-y-8">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/20 space-y-2">
                           <div className="flex items-center gap-3">
                               <Sparkles className="w-5 h-5 text-indigo-600" />
                               <h3 className="text-xl font-black text-slate-900 serif">Gateway Governance</h3>
                           </div>
                           <p className="text-sm text-slate-500 font-medium ml-8">Konfigurér brugsgrænser for AI-arkitekturen baseret på medlemskab.</p>
                        </div>
                        <div className="p-10 space-y-12">
                            {!limitsSettings ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 gap-6">
                                    <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Retrieving security policies...</p>
                                </div>
                            ) : (
                                <div className="space-y-16">
                                    {['Kollega', 'Kollega+'].map((tier, tidx) => (
                                        <div key={tier} className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${tier === 'Kollega' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-900 text-white shadow-xl shadow-indigo-900/20'}`}>
                                                    {tier === 'Kollega' ? 'F' : 'P'}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Access Dimensions for {tier}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{tier === 'Kollega' ? 'Freemium Constraints' : 'Premium Tier Overrides'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'concepts', label: 'Begrebsguide' },
                                                    { id: 'cases', label: 'Case-træner' },
                                                    { id: 'journal', label: 'Journal-træner' },
                                                    { id: 'architect', label: 'Arkitekt' },
                                                    { id: 'oralExam', label: 'Mundtlig' },
                                                    { id: 'opinion', label: 'Opinion' },
                                                    { id: 'star', label: 'STAR' },
                                                    { id: 'caseAnalyser', label: 'Analyser' }
                                                ].map((f, fidx) => (
                                                    <div key={f.id} className="relative group">
                                                        <div className="absolute inset-0 bg-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="relative p-6 bg-slate-50 border border-slate-100 rounded-2xl transition-all group-hover:border-indigo-100">
                                                            <label className="block text-[8px] font-black uppercase text-slate-400 mb-3 tracking-widest">{f.label}</label>
                                                            <input 
                                                                type="number"
                                                                value={limitsSettings[tier][f.id]}
                                                                onChange={(e) => updateLimitValue(tier, f.id, e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 serif italic focus:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-8 border-t border-slate-50 flex justify-end">
                                        <button 
                                            onClick={handleSaveLimits} 
                                            disabled={isSavingLimits}
                                            className="h-16 px-12 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {isSavingLimits ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} {isSavingLimits ? 'Deploying...' : 'Confirm Policies'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Theme & Visual Pulse */}
                <div className="xl:col-span-4 space-y-8">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/20 space-y-2">
                           <div className="flex items-center gap-3">
                               <Palette className="w-5 h-5 text-indigo-600" />
                               <h3 className="text-xl font-black text-slate-900 serif">Atmosphere Engine</h3>
                           </div>
                           <p className="text-sm text-slate-500 font-medium ml-8">Propagér et visuelt skift til alle brugere.</p>
                        </div>
                        <div className="p-8 grid grid-cols-2 gap-4">
                            {[
                                { id: 'default', label: 'Modern', icon: Layout, color: 'text-slate-400', bg: 'bg-slate-50' },
                                { id: 'christmas', label: 'Ember', icon: Snowflake, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { id: 'easter', label: 'Spring', icon: Bird, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                                { id: 'halloween', label: 'Void', icon: Ghost, color: 'text-orange-500', bg: 'bg-orange-50' }
                            ].map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleSaveTheme(theme.id)}
                                    disabled={isSavingTheme}
                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 relative group ${activeTheme === theme.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-transparent bg-slate-50 hover:bg-white hover:border-slate-100'}`}
                                >
                                    <theme.icon className={`w-8 h-8 ${activeTheme === theme.id ? 'text-white' : theme.color} group-hover:scale-110 transition-transform`} />
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${activeTheme === theme.id ? 'text-white/50' : 'text-slate-400'}`}>{theme.label}</p>
                                    {isSavingTheme && activeTheme !== theme.id && (
                                        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-[2rem] flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Network Health</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Uptime</span>
                                <span className="text-xs font-black text-indigo-600">99.998%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white border border-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[99%]" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">Systemet kører på Firebase Edge netværket med automatisk load balancing og DDoS beskyttelse.</p>
                        </div>
                    </section>
                </div>

                {/* Activity Feed */}
                <div className="xl:col-span-12">
                   <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                           <div className="space-y-1">
                               <div className="flex items-center gap-3 text-slate-900 serif">
                                   <Clock className="w-5 h-5 text-slate-400" />
                                   <h3 className="text-xl font-black">Live Pulse Terminal</h3>
                               </div>
                               <p className="text-sm text-slate-500 font-medium ml-8">Monitoring af de seneste 200 sidevisninger og platform-interaktioner.</p>
                           </div>
                           <button 
                                onClick={() => setShowActivityLog(!showActivityLog)}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border shadow-sm ${showActivityLog ? 'bg-white text-slate-400 border-slate-100' : 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10'}`}
                            >
                                {showActivityLog ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showActivityLog ? 'Hide Feed' : 'Launch Feed'}
                            </button>
                        </div>
                        
                        <AnimatePresence>
                        {showActivityLog && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="overflow-x-auto min-h-[400px]">
                                    {pageViewsLoading ? (
                                        <div className="flex flex-col items-center justify-center p-32 gap-6">
                                            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing audit logs...</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-10 py-6">Timestamp / Seq</th>
                                                    <th className="px-10 py-6">Operator</th>
                                                    <th className="px-10 py-6">Request Pattern / Route</th>
                                                    <th className="px-10 py-6 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 font-mono">
                                                {enrichedPageViews.map((view, vidx) => (
                                                    <motion.tr 
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: vidx * 0.01 }}
                                                        key={view.id} className="hover:bg-slate-50/30 transition-colors group"
                                                    >
                                                        <td className="px-10 py-5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {view.timestamp?.toDate().toLocaleString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            <span className="ml-4 opacity-30">#ID-{view.id.slice(0, 6)}</span>
                                                        </td>
                                                        <td className="px-10 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                                <span className="text-sm font-black text-slate-900 tracking-tight">{view.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-5">
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50/50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tight border border-blue-100/50 w-fit">
                                                                <Share2 className="w-3 h-3" /> {view.path}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-5 text-right">
                                                            <span className="text-[10px] font-black text-emerald-600">200 OK</span>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                   </section>
                </div>

                {/* Error Log */}
                <div className="xl:col-span-12">
                   <section className="bg-white rounded-[3.5rem] border border-rose-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-rose-50 bg-rose-50/10 space-y-2">
                           <div className="flex items-center gap-3">
                               <AlertCircle className="w-5 h-5 text-rose-500" />
                               <h3 className="text-xl font-black text-rose-950 serif">Error Registry</h3>
                           </div>
                           <p className="text-sm text-slate-500 font-medium ml-8">Monitoring af systemfejl, nedbrud og toast-notificerede exceptions.</p>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            {systemErrors && systemErrors.length > 0 ? (
                                <table className="w-full text-left font-mono">
                                    <thead className="bg-rose-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 border-b border-rose-100">
                                        <tr>
                                            <th className="px-10 py-6">Incident Date</th>
                                            <th className="px-10 py-6">Diagnostic Message</th>
                                            <th className="px-10 py-6">Context / Origin</th>
                                            <th className="px-10 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-50">
                                        {systemErrors.map((err, eidx) => (
                                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: eidx * 0.05 }} key={err.id} className="hover:bg-rose-50/10 group">
                                                <td className="px-10 py-8 text-[10px] font-black text-rose-400 uppercase tracking-widest align-top">
                                                    {err.timestamp?.toDate().toLocaleString('da-DK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-10 py-8 align-top">
                                                    <p className="text-sm font-black text-rose-900 uppercase tracking-tight mb-2 leading-tight">{err.title}</p>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic max-w-lg">"{err.description}"</p>
                                                </td>
                                                <td className="px-10 py-8 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-rose-100 rounded-lg text-[9px] font-black text-rose-600 uppercase tracking-widest w-fit">
                                                            {err.path}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{err.userName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right align-top">
                                                    <button 
                                                        onClick={() => handleDeleteError(err.id)}
                                                        className="w-12 h-12 flex items-center justify-center bg-white border border-rose-100 text-rose-300 hover:text-rose-600 rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-32 gap-6">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-inner">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-2xl font-black text-slate-800 serif">Systems Nominal</h4>
                                        <p className="text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Zero incidents detected in active session.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                   </section>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemPage;
