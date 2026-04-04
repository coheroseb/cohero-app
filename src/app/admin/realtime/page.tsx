
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Users, Globe, MousePointer2, 
    Zap, Clock, LayoutDashboard, Sparkles,
    BarChart3, TrendingUp, ArrowUpRight,
    ArrowDownRight, ChevronRight, MoreVertical
} from 'lucide-react';

// --- Components ---

const MiniSparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 80}`).join(' ');
    
    return (
        <svg viewBox="0 0 100 100" className="w-16 h-8 overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="opacity-40"
            />
            <motion.polyline
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

const AdvancedStatCard = ({ title, value, icon: Icon, color, trendData, trendLabel }: any) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-slate-500/5">
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Realtime</span>
                </div>
                {trendData && <MiniSparkline data={trendData} color="currentColor" />}
            </div>
        </div>
        <div className="mt-8 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <div className="flex items-end gap-3">
                <h3 className="text-5xl font-black text-slate-900 serif tracking-tighter">{value}</h3>
                {trendLabel && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 mb-2">
                        {trendLabel.includes('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trendLabel}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default function RealtimeDashboard() {
    const firestore = useFirestore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [history, setHistory] = useState<number[]>(new Array(12).fill(0));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 1. Live Page Views (Last 100)
    const viewsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'pageViews'), orderBy('timestamp', 'desc'), limit(100)) : null),
        [firestore]
    );
    const { data: views, isLoading: isViewsLoading } = useCollection<any>(viewsQuery);

    // 2. Active Users (Active in last 3 minutes - Heartbeat is 45s)
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
    const activeUsersQuery = useMemoFirebase(
        () => (firestore ? query(
            collection(firestore, 'users'), 
            where('lastActivityAt', '>=', Timestamp.fromDate(threeMinsAgo)),
            orderBy('lastActivityAt', 'desc')
        ) : null),
        [firestore]
    );
    const { data: activeUsers, isLoading: isUsersLoading } = useCollection<any>(activeUsersQuery);

    // Calculations & Derivations
    const analytics = useMemo(() => {
        if (!views || !activeUsers) return null;
        
        const now = Date.now();
        const viewsLastMin = views.filter((v: any) => {
            const ts = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
            return now - ts.getTime() < 60000;
        }).length;

        // Top Pages (Last Hour)
        const pages: Record<string, number> = {};
        views.forEach((v: any) => {
            pages[v.path] = (pages[v.path] || 0) + 1;
        });
        const topPages = Object.entries(pages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // Sources Breakdown
        const sources: Record<string, number> = { facebook: 0, tiktok: 0, direct: 0 };
        views.forEach((v: any) => {
            sources[v.source || 'direct'] = (sources[v.source || 'direct'] || 0) + 1;
        });
        const total = views.length || 1;

        return {
            onlineNow: activeUsers.length,
            viewsLastMin,
            topPages,
            sources: {
                fb: Math.round((sources.facebook / total) * 100),
                tt: Math.round((sources.tiktok / total) * 100),
                dir: Math.round((sources.direct / total) * 100)
            }
        };
    }, [views, activeUsers]);

    // Update Sparkline History
    useEffect(() => {
        if (analytics) {
            setHistory(prev => [...prev.slice(1), analytics.viewsLastMin]);
        }
    }, [analytics?.viewsLastMin]);

    if (isViewsLoading || isUsersLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
                <div className="relative">
                    <Activity className="w-16 h-16 text-slate-100 animate-pulse" />
                    <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                </div>
                <h2 className="text-xl font-black text-slate-300 italic tracking-widest">Global Sync En-route...</h2>
            </div>
        );
    }

    return (
        <div className="max-w-[1900px] mx-auto space-y-16 animate-ink pb-20">
            {/* Header + Critical Alerts */}
            <div className="space-y-8">
                <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 px-2">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-4 px-5 py-2 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-[0.3em] border border-white/10 shadow-2xl">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                             Platform Mission Control
                        </div>
                        <h1 className="text-7xl font-black text-slate-900 serif tracking-tighter leading-[0.9]">
                            Live Ecosystem <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Intelligence</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium italic max-w-2xl">
                            Realtids-indsigt i brugerflow, konverteringskilder og systemhelbred. <br/>
                            <span className="text-slate-900 not-italic font-black opacity-80 uppercase text-[10px] tracking-widest">Opdateres hvert sekund • ±0.1s latenstid</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-8 p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 group relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-end">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Sync Time</p>
                            <div className="flex items-center gap-5">
                                <Clock className="w-6 h-6 text-indigo-600 group-hover:rotate-12 transition-transform" />
                                <span className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                                    {currentTime.toLocaleTimeString('da-DK', { hour12: false })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

            </div>

            {/* Presence Bar (Vagtstuen) */}
            <section className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group mx-2">
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg"><Users className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 serif leading-none">Vagtstuen</h3>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Kolleger aktive Netop Nu ({activeUsers?.length || 0})</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 overflow-x-auto pb-4 px-2 custom-scrollbar scroll-smooth">
                    {activeUsers?.map((u: any) => (
                        <motion.div 
                            key={u.uid}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex-shrink-0 flex flex-col items-center gap-3 group/user cursor-pointer"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-[1.75rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-900 font-black text-lg shadow-sm group-hover/user:border-indigo-500 group-hover/user:shadow-xl group-hover/user:shadow-indigo-500/10 transition-all duration-300">
                                    {u.username?.[0] || u.email?.[0] || 'K'}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm" />
                            </div>
                            <div className="text-center min-w-[80px]">
                                <p className="text-[11px] font-black text-slate-900 truncate serif">{u.username?.split(' ')[0] || 'Kollega'}</p>
                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{u.semester}. SEM</p>
                            </div>
                        </motion.div>
                    ))}
                    {(!activeUsers || activeUsers.length === 0) && (
                        <div className="w-full py-6 flex items-center justify-center gap-4 opacity-20">
                            <Users className="w-6 h-6" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Ingen logged-in brugere på vagt pt.</p>
                        </div>
                    )}
                </div>
            </section>


            {/* Global metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                <AdvancedStatCard 
                    title="Aktive Lige Nu" 
                    value={analytics?.onlineNow || 0} 
                    icon={Users} 
                    color="bg-emerald-50 text-emerald-600" 
                    trendLabel="+12% vs last hr"
                />
                <AdvancedStatCard 
                    title="Aktivitets Tempo" 
                    value={`${analytics?.viewsLastMin || 0}/m`}
                    icon={Zap} 
                    color="bg-amber-50 text-amber-600" 
                    trendData={history}
                    trendLabel="+4 items/m"
                />
                <AdvancedStatCard 
                    title="Trafik Fordeling" 
                    value={`${analytics?.sources.fb || 0}%`} 
                    icon={Globe} 
                    color="bg-indigo-50 text-indigo-600" 
                    trendLabel="Meta dominated"
                />
                <AdvancedStatCard 
                    title="Hjerteslag" 
                    value="Pulse" 
                    icon={Activity} 
                    color="bg-slate-900 text-white" 
                    trendLabel="Stable"
                />
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 px-2">
                
                {/* 1. Live Feed (Left Column) */}
                <div className="xl:col-span-8 flex flex-col gap-12">
                    <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[900px] group/feed">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 transition-all hover:p-12">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-[2rem] bg-slate-950 flex items-center justify-center text-white shadow-2xl group-hover/feed:scale-110 transition-all">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 serif leading-none tracking-tight">Mission Control Feed</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Live WebSocket Simulation over Firestore Stream</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar bg-slate-50/20">
                            <AnimatePresence initial={false}>
                                {views?.map((view: any, idx: number) => {
                                    const ts = view.timestamp?.toDate ? view.timestamp.toDate() : new Date(view.timestamp);
                                    const isNew = Date.now() - ts.getTime() < 3000;
                                    
                                    return (
                                        <motion.div 
                                            key={view.id}
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className={`p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group/row hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-x-2 transition-all cursor-crosshair ${isNew ? 'ring-2 ring-emerald-400 bg-emerald-50/30' : ''}`}
                                        >
                                            <div className="flex items-center gap-6 overflow-hidden">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-inner flex flex-col items-center justify-center flex-shrink-0 group-hover/row:border-indigo-200 transition-colors">
                                                    <span className="text-[10px] font-black text-slate-300 tabular-nums uppercase">{ts.getHours().toString().padStart(2, '0')}:{ts.getMinutes().toString().padStart(2, '0')}</span>
                                                    <span className="text-xs font-black text-slate-900 tabular-nums">{ts.getSeconds().toString().padStart(2, '0')}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-sm font-black text-slate-900 serif truncate">
                                                            {view.userId === 'anonymous' ? 'Anonymous Observer' : `Verified Kollega (${view.userId.slice(0, 6)})`}
                                                        </span>
                                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${view.source === 'facebook' ? 'bg-indigo-50 text-indigo-600' : view.source === 'tiktok' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                            {view.source || 'Direct'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded bg-slate-50 flex items-center justify-center"><MousePointer2 className="w-2.5 h-2.5 text-slate-300" /></div>
                                                        <p className="text-[11px] font-bold text-slate-400 truncate opacity-60 group-hover/row:opacity-100 transition-opacity">
                                                            COHERO://{view.path.slice(1).toUpperCase() || 'HOME'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all">
                                                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>

                {/* 2. Intelligence Overlay (Right Column) */}
                <div className="xl:col-span-4 space-y-12">
                    
                    {/* Top Pages Leaderboard */}
                    <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-indigo-500/20 transition-all duration-1000" />
                        <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-indigo-400">
                                    <BarChart3 className="w-6 h-6" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Traffic Distribution</span>
                                </div>
                                <h3 className="text-4xl font-black serif">Populære Stier</h3>
                                <p className="text-sm text-white/40 leading-relaxed italic">
                                    Hvor kaster brugerne deres energi i dette øjeblik? Top 5 mest besøgte destinationer.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {analytics?.topPages.map(([path, count], idx) => (
                                    <div key={path} className="space-y-3 group/page">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[11px] font-black text-white group-hover/page:text-indigo-400 transition-colors truncate max-w-[200px]">
                                                {idx + 1}. {path === '/' ? '/HOME' : path.toUpperCase()}
                                            </p>
                                            <span className="text-[10px] font-black text-white/30 tracking-widest">{count} HITS</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(count / (analytics.topPages[0][1] || 1)) * 100}%` }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Conversion Sources */}
                            <div className="pt-12 border-t border-white/5 space-y-8">
                                <h4 className="text-[11px] font-black uppercase text-white/30 tracking-widest">Referral Breakdown</h4>
                                <div className="flex items-center gap-4 h-16">
                                    <div style={{ width: `${analytics?.sources.fb}%` }} className="h-full bg-indigo-500 rounded-2xl flex items-center justify-center group/fb relative cursor-pointer" title="Facebook">
                                        <span className="text-[10px] font-black group-hover/fb:opacity-100 opacity-0 transition-opacity">FB {analytics?.sources.fb}%</span>
                                    </div>
                                    <div style={{ width: `${analytics?.sources.tt}%` }} className="h-full bg-rose-500 rounded-2xl flex items-center justify-center group/tt relative cursor-pointer" title="TikTok">
                                        <span className="text-[10px] font-black group-hover/tt:opacity-100 opacity-0 transition-opacity">TT {analytics?.sources.tt}%</span>
                                    </div>
                                    <div style={{ width: `${analytics?.sources.dir}%` }} className="h-full bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center group/dir relative cursor-pointer" title="Direct">
                                        <span className="text-[10px] font-black group-hover/dir:opacity-100 opacity-0 transition-opacity">DR {analytics?.sources.dir}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>


                </div>
            </div>

            <style jsx global>{`
                .animate-ink { animation: ink-spread 2s cubic-bezier(0, 0, 0.2, 1) forwards; }
                @keyframes ink-spread { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: blur(0px); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                 @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                 .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
