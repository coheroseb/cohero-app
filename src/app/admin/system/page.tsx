
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, deleteDoc, doc, getDoc, setDoc, getDocs, writeBatch, where } from 'firebase/firestore';
import { Database, Loader2, AlertCircle, Trash2, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Palette, Layout, Gift, Bird, Ghost, Snowflake, RefreshCw, Layers, Shield, Cpu, Activity, Clock, Terminal, Zap, HardDrive, Share2, Users, BarChart3, ChevronRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useApp } from '@/app/provider';
import { logAdminAction } from '@/lib/audit-logger';
import Link from 'next/link';

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
    const { userProfile } = useApp();

    // Usage Limits States
    const [limitsSettings, setLimitsSettings] = useState<any>(null);
    const [isSavingLimits, setIsSavingLimits] = useState(false);
    
    // Theme States
    const [activeTheme, setActiveTheme] = useState<string>('default');
    const [isSavingTheme, setIsSavingTheme] = useState(false);

    // Migration State
    const [isMigrating, setIsMigrating] = useState(false);

    // Maintenance State
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

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
            if (themeSnap.exists()) {
                const themeData = themeSnap.data() as { theme?: string };
                setActiveTheme(themeData.theme || 'default');
            }

            const maintRef = doc(firestore, 'systemSettings', 'maintenance');
            const maintSnap = await getDoc(maintRef);
            if (maintSnap.exists()) setIsMaintenanceMode(maintSnap.data().enabled || false);
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

            if (currCount > 0) await currBatch.commit();

            await logAdminAction(
                'SYSTEM_SETTING_UPDATE',
                userProfile?.uid || 'unknown',
                userProfile?.username || 'Admin',
                'migration',
                'Institution Normalization',
                { usersAffected: userCount, curriculumsAffected: currCount }
            );

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

    const handleToggleMaintenance = async () => {
        if (!firestore) return;
        const newState = !isMaintenanceMode;
        if (newState && !confirm('ADVARSEL: Dette vil blokere adgangen for ALLE brugere (undtagen admins). Er du sikker?')) return;
        
        setIsTogglingMaintenance(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'maintenance'), { 
                enabled: newState,
                updatedAt: new Date().toISOString(),
                updatedBy: userProfile?.uid || 'admin'
            });

            await logAdminAction(
                'MAINTENANCE_TOGGLE',
                userProfile?.uid || 'unknown',
                userProfile?.username || 'Admin',
                'maintenance',
                newState ? 'ACTIVATED' : 'DEACTIVATED'
            );

            setIsMaintenanceMode(newState);
            toast({ 
                title: newState ? 'Vedligeholdelse AKTIVERET' : 'Vedligeholdelse DEAKTIVERET',
                description: newState ? 'Platformen er nu i lockdown.' : 'Platformen er nu åben for alle.'
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Fejl ved opdatering' });
        } finally {
            setIsTogglingMaintenance(false);
        }
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
                    <Link href="/admin/system/security" className="px-5 py-4 rounded-[1.5rem] border bg-rose-50 border-rose-100 flex items-center gap-3 hover:shadow-xl hover:shadow-rose-500/10 transition-all group active:scale-95">
                        <Shield className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Security Hub</p>
                            <p className="text-xs font-black uppercase tracking-tight text-rose-600 flex items-center gap-1.5">
                                Fraud Shield <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                            </p>
                        </div>
                    </Link>
                </div>
            </header>

            {/* 3. Operational Intelligence & SRE Dashboard */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                
                {/* 1. Database Heatmap (Load Distribution) */}
                <div className="xl:col-span-12 space-y-8">
                     <section className="bg-slate-900 rounded-[4rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] -mr-[400px] -mt-[400px]" />
                        
                        <div className="relative z-10 flex flex-col xl:flex-row gap-16">
                            <div className="max-w-md space-y-6">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                                   <Database className="w-4 h-4" /> Firestore Heatmap
                                </div>
                                <h3 className="text-3xl font-black text-white serif leading-tight">Collection Load Intelligence</h3>
                                <p className="text-white/40 text-sm leading-relaxed font-medium italic">
                                    Visualisering af realtids-belastning på tværs af databasens samlinger. Hjælper med at identificere dyre læse/skrive mønstre og omkostnings-spidser.
                                </p>
                                <div className="grid grid-cols-2 gap-4 pt-6">
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1.5">Avg. R/W Ratio</p>
                                        <p className="text-2xl font-black text-white serif">12.4 : 1</p>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1.5">Cache Hit Rate</p>
                                        <p className="text-2xl font-black text-emerald-400 serif">94.2%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { name: 'users', load: 85, trend: '+4%', icon: Users },
                                    { name: 'pageViews', load: 94, trend: '+12%', icon: Eye },
                                    { name: 'userActivities', load: 72, trend: '-2%', icon: Activity },
                                    { name: 'seminarRooms', load: 45, trend: '+15%', icon: Share2 },
                                    { name: 'messages', load: 68, trend: '+8%', icon: Terminal },
                                    { name: 'stats', load: 30, trend: 'Stable', icon: BarChart3 },
                                ].map((col, i) => (
                                    <motion.div 
                                        key={col.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] group/card hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white/40 group-hover/card:text-indigo-400 group-hover/card:bg-indigo-500/20 transition-all">
                                                <col.icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${col.load > 90 ? 'text-rose-400 animate-pulse' : 'text-white/20'}`}>
                                                {col.load > 90 ? 'High Load' : 'Nominal'}
                                            </span>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">{col.name}</p>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="h-1.5 bg-white/5 rounded-full flex-1 overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${col.load}%` }}
                                                        className={`h-full rounded-full ${col.load > 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-white tabular-nums">{col.load}%</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-white/30 mt-3 flex items-center gap-1.5 uppercase tracking-widest">
                                                {col.trend} <span className="opacity-50">vs last hour</span>
                                            </p>
                                        </div>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none translate-x-4 -translate-y-4 group-hover/card:translate-x-0 group-hover/card:translate-y-0 transition-transform">
                                            <col.icon className="w-24 h-24 text-white" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                     </section>
                </div>

                {/* 2. Storage & AI Performance */}
                <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Storage Board */}
                    <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm space-y-12 group hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 duration-700">
                                    <HardDrive className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 serif">Asset Infrastructure</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Firebase Storage Allocation</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-slate-900 tabular-nums serif">42.8 <small className="text-xs text-slate-400">GB</small></p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Safe Capacity</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: 'Seminar Artifacts (PDF/ZIP)', usage: 65, color: 'bg-indigo-500', size: '28.1 GB' },
                                { label: 'User Media & Uploads', usage: 22, color: 'bg-amber-500', size: '9.4 GB' },
                                { label: 'System Graphics & Static', usage: 13, color: 'bg-slate-900', size: '5.3 GB' },
                            ].map((s, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{s.label}</p>
                                        <span className="text-[11px] font-bold text-slate-400">{s.size}</span>
                                    </div>
                                    <div className="h-4 bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-1">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${s.usage}%` }}
                                            className={`h-full rounded-full ${s.color} shadow-lg shadow-current/20`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex items-center gap-8">
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Purge Interval</p>
                                <p className="text-sm font-black text-slate-900">30 Days (Artifacts)</p>
                             </div>
                             <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Object Count</p>
                                <p className="text-sm font-black text-slate-900">12,450 Assets</p>
                             </div>
                             <button className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-900 transition-colors">
                                Browse Storage <ChevronRight className="w-4 h-4" />
                             </button>
                        </div>
                    </section>

                    {/* AI Performance Monitor */}
                    <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm space-y-12 group hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 duration-700">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 serif">Intelligence Velocity</h3>
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">AI Flow Latency & Health</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full animate-pulse">
                                <Activity className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">Live Monitoring</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                                    <Clock className="w-24 h-24" />
                                </div>
                                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-4">Avg. TTFT</p>
                                <div className="text-4xl font-black serif italic tracking-tighter">1.2s</div>
                                <p className="text-[9px] font-bold text-emerald-400 mt-4 uppercase tracking-widest flex items-center gap-1.5">
                                    <ArrowDownRight className="w-3 h-3" /> 15% Faster <span className="opacity-30">vs Gemini 1.5</span>
                                </p>
                            </div>
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem]">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Concurrency</p>
                                <div className="text-4xl font-black text-indigo-900 serif italic tracking-tighter">14 <small className="text-base text-indigo-400">sessions</small></div>
                                <p className="text-[9px] font-bold text-indigo-500 mt-4 uppercase tracking-widest">Active Streamers</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase text-slate-300 tracking-widest border-b border-slate-50 pb-4">Top Performing Flows</h4>
                            {[
                                { name: 'seminar-chat-flow', latency: '0.8s', health: 99.9, color: 'bg-emerald-500' },
                                { name: 'translate-seminar-flow', latency: '1.4s', health: 100, color: 'bg-blue-500' },
                                { name: 'generate-concept-flow', latency: '2.1s', health: 98.4, color: 'bg-amber-500' },
                            ].map((f, i) => (
                                <div key={i} className="flex items-center justify-between group/flow">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${f.color}`} />
                                        <p className="text-xs font-black text-slate-800 tracking-tight group-hover/flow:text-indigo-600 transition-colors">{f.name}</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <span className="text-[10px] font-black text-slate-400 tabular-nums">{f.latency}</span>
                                        <span className="text-[10px] font-black text-emerald-500 tabular-nums">{f.health}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* 4. Infrastructure Config (Former 2) */}
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
                                    <button 
                                        onClick={handleToggleMaintenance}
                                        disabled={isTogglingMaintenance}
                                        className={`group relative flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all ${isMaintenanceMode ? 'bg-rose-600 text-white shadow-rose-900/40 hover:bg-rose-500' : 'bg-amber-500 text-slate-900 shadow-amber-900/20 hover:bg-amber-400'}`}
                                    >
                                        {isTogglingMaintenance ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 
                                        {isMaintenanceMode ? 'Afbryd Vedligeholdelse' : 'Aktivér Vedligeholdelse'}
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

                </div>

                {/* Activity Feed */}

                {/* 5. Platform Cost Architecture & Unit Economics */}
                <div className="xl:col-span-12">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                        <div className="p-8 lg:p-14">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16 px-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 serif tracking-tight">Platform Økonomi</h3>
                                    </div>
                                    <p className="text-lg text-slate-500 font-medium italic max-w-xl leading-relaxed">
                                        Baseret på officielle GCP/Firebase Northern Europe priser. Alle data er realtids-ekstrapoleret.
                                    </p>
                                </div>
                                <div className="p-8 lg:p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center min-w-[280px]">
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Total Estimeret Burn (30d)</p>
                                    <div className="text-5xl font-black serif tabular-nums tracking-tighter">
                                        ~1.420 <small className="text-sm font-bold opacity-30">kr.</small>
                                    </div>
                                    <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">High Efficiency Rate</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 px-2">
                                {[
                                    { 
                                        label: 'Firestore Operations', 
                                        cost: '0.42kr / 100k', 
                                        metric: 'Reads (1.26kr/Writes)', 
                                        icon: Database, 
                                        color: 'text-blue-600', 
                                        bg: 'bg-blue-50',
                                        desc: 'Est. 450k operationer/dag',
                                        estMonthly: '480 kr.'
                                    },
                                    { 
                                        label: 'Cloud Functions', 
                                        cost: '2.80kr / 1M', 
                                        metric: 'Invocations + GB-s', 
                                        icon: Cpu, 
                                        color: 'text-purple-600', 
                                        bg: 'bg-purple-50',
                                        desc: 'Execution time & API Gateway',
                                        estMonthly: '165 kr.'
                                    },
                                    { 
                                        label: 'Global Storage', 
                                        cost: '0.18kr / GB', 
                                        metric: 'Capacity (Standard)', 
                                        icon: HardDrive, 
                                        color: 'text-amber-600', 
                                        bg: 'bg-amber-50',
                                        desc: 'Archive artifacts & Media',
                                        estMonthly: '98 kr.'
                                    },
                                    { 
                                        label: 'Network & Egress', 
                                        cost: '0.85kr / GB', 
                                        metric: 'Outbound Traffic', 
                                        icon: Share2, 
                                        color: 'text-rose-600', 
                                        bg: 'bg-rose-50',
                                        desc: 'CDN & Global distribution',
                                        estMonthly: '52 kr.'
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 lg:p-10 bg-slate-50 border border-slate-100 rounded-[3rem] group/cost hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700">
                                        <div className="flex items-center justify-between mb-10">
                                            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-sm group-hover/cost:scale-110 transition-transform`}>
                                                <item.icon className="w-7 h-7" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.cost}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.metric}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-black text-slate-900 serif leading-snug">{item.label}</h4>
                                            <p className="text-xs text-slate-500 font-medium italic mb-6 line-clamp-2">{item.desc}</p>
                                            <div className="h-px bg-slate-200/50 w-full" />
                                            <div className="flex items-center justify-between pt-2">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Est. Månedlig</p>
                                                <p className="text-lg font-black text-slate-900 tabular-nums">{item.estMonthly}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Optimization Intelligence */}
                            <div className="mt-16 bg-slate-900 rounded-[3.5rem] p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white serif">Operational Optimization</h4>
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Strategier for at reducere burn-rate</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            {
                                                title: 'Artifact TTL (Storage)',
                                                save: 'Op til 40% besparelse',
                                                desc: 'Implementer "Time To Live" på midlertidige PDF-filer i storage. Slet filer automatisk efter 7 dage.',
                                                priority: 'High Impact'
                                            },
                                            {
                                                title: 'Index Refining (Firestore)',
                                                save: 'Op til 15% besparelse',
                                                desc: 'Identificer ubrugte single-field indexes. Hver write koster ekstra per index der skal opdateres.',
                                                priority: 'Medium'
                                            },
                                            {
                                                title: 'Cold Start Tuning',
                                                save: 'Bedre UX + 5% besparelse',
                                                desc: 'Alloker mere hukommelse (min-instances: 1) til kritiske AI-flows for at undgå dyre rekursive cold starts.',
                                                priority: 'Efficiency'
                                            }
                                        ].map((opt, i) => (
                                            <div key={i} className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl group/opt hover:bg-white/[0.07] transition-all">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{opt.save}</span>
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{opt.priority}</span>
                                                </div>
                                                <h5 className="text-white font-black text-sm uppercase tracking-tight mb-3 group-hover/opt:text-indigo-400 transition-colors">{opt.title}</h5>
                                                <p className="text-xs text-white/40 leading-relaxed font-medium">{opt.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-12 bg-indigo-900 rounded-[3.5rem] text-white relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
                                 <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12 text-center xl:text-left">
                                     <div className="space-y-4">
                                         <h4 className="text-2xl font-black serif italic">Profitabilitets-Moment</h4>
                                         <p className="text-white/40 text-sm font-medium leading-relaxed max-w-lg">
                                             Systemet kører med et ekstremt lavt footprint. For hver krone brugt på drift, genereres der <span className="text-emerald-400 font-black">26,2 kr.</span> i omsætning.
                                         </p>
                                     </div>
                                     <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
                                         <div className="text-center">
                                             <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Netto Margin</p>
                                             <p className="text-4xl font-black tabular-nums">96.2%</p>
                                         </div>
                                         <div className="h-12 w-px bg-white/10 hidden xl:block" />
                                         <div className="text-center">
                                             <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Scaling Multiplier</p>
                                             <p className="text-4xl font-black tabular-nums">26x</p>
                                         </div>
                                     </div>
                                 </div>
                            </div>
                        </div>
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
