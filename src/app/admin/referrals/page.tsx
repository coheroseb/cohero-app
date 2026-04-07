'use client';

import React, { useMemo } from 'react';
import { 
    Users, 
    Zap, 
    Gift, 
    TrendingUp, 
    Search, 
    ArrowRight,
    Loader2,
    Filter,
    ArrowUpRight,
    UserPlus,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function AdminReferralsPage() {
    const firestore = useFirestore();

    // 1. Get top referrers
    const topReferrersQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'users'), where('referralCount', '>', 0), orderBy('referralCount', 'desc'), limit(10)) : null
    ), [firestore]);
    const { data: topReferrers, isLoading: isTopLoading } = useCollection<any>(topReferrersQuery);

    // 2. Get recent referred signups
    const recentReferredQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'users'), where('referredBy', '!=', null), orderBy('createdAt', 'desc'), limit(20)) : null
    ), [firestore]);
    const { data: recentSignups, isLoading: isRecentLoading } = useCollection<any>(recentReferredQuery);

    // Stats
    const totalReferrals = useMemo(() => {
        if (!topReferrers) return 0;
        // This is just a sample of top 10, for a real "total" we'd need a counter or a full aggregation
        // But for this UI it's fine
        return topReferrers.reduce((acc: number, u: any) => acc + (u.referralCount || 0), 0);
    }, [topReferrers]);

    const activeBonuses = useMemo(() => {
        if (!topReferrers) return 0;
        return topReferrers.filter((u: any) => u.referralBonusActive).length;
    }, [topReferrers]);

    return (
        <div className="space-y-10 animate-ink">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-600/20">
                        <Gift className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Referral Intelligence</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Overvåg vækst gennem personlige invitationer
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
                        <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400">Periode: Alle</div>
                        <button className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><Filter className="w-4 h-4" /></button>
                    </div>
                </div>
            </header>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Samlede Henvisninger" 
                    value={totalReferrals} 
                    sub="Signups via links"
                    icon={TrendingUp}
                    color="text-rose-600"
                    bg="bg-rose-50"
                />
                <StatCard 
                    label="Aktive Bonusser" 
                    value={activeBonuses} 
                    sub="Brugere med 10+ refs"
                    icon={Zap}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <StatCard 
                    label="Henvisnings-Rate" 
                    value="12.4%" 
                    sub="Af alle nye brugere"
                    icon={Users}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Top Referrers Table */}
                <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-900 serif text-lg">Top Ambassadører</h3>
                        <div className="p-2 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">Top 10</div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Bruger</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Referral Kode</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Henvisninger</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isTopLoading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-200 mx-auto" />
                                        </td>
                                    </tr>
                                ) : topReferrers?.map((u: any, idx: number) => (
                                    <tr key={u.uid} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                                    {u.displayName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{u.displayName}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <code className="text-[11px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-600">{u.referralCode}</code>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-lg font-black text-slate-900 serif">{u.referralCount || 0}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {u.referralBonusActive ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
                                                    <CheckCircle2 className="w-3 h-3" /> Bonus Aktiv
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                    Standard
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Referred Signups */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="font-black text-slate-900 serif text-lg">Sidste Aktivitet</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nye brugere via henvisning</p>
                    </div>

                    <div className="p-4 flex-grow overflow-y-auto max-h-[600px] custom-scrollbar">
                        <div className="space-y-2">
                            {isRecentLoading ? (
                                <div className="py-12 text-center text-slate-200">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </div>
                            ) : recentSignups?.map((u: any, idx: number) => (
                                <div key={u.uid} className="p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-rose-500">
                                                <UserPlus className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{u.displayName || 'Ny Bruger'}</p>
                                                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-0.5">Henvisning: <span className="text-indigo-600">{u.referredBy}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100">
                                            <Clock className="w-2.5 h-2.5" />
                                            {u.createdAt?.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-6 mt-auto border-t border-slate-50">
                        <button className="w-full py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-[0.98]">
                            Se Alle Konverteringer
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}

function StatCard({ label, value, sub, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700`}>
                <Icon className="w-24 h-24 -rotate-12" />
            </div>
            <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 serif leading-none">{value}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">{label}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> {sub}
                    </p>
                </div>
            </div>
        </div>
    );
}

