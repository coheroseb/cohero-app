
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

    // 1. Active Users (Active in last 3 minutes - Heartbeat is 45s)
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

    if (isUsersLoading) {
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
                            Realtids-indsigt i aktive kolleger og systemhelbred. <br/>
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
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Kolleger aktive Netop Nu ({activeUsers?.filter((u: any) => u.role !== 'admin').length || 0})</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 overflow-x-auto pb-4 px-2 custom-scrollbar scroll-smooth">
                    {activeUsers?.filter((u: any) => u.role !== 'admin').map((u: any) => (
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
                    {(!activeUsers || activeUsers.filter((u: any) => u.role !== 'admin').length === 0) && (
                        <div className="w-full py-6 flex items-center justify-center gap-4 opacity-20">
                            <Users className="w-6 h-6" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Ingen logged-in brugere på vagt pt.</p>
                        </div>
                    )}
                </div>
            </section>

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
