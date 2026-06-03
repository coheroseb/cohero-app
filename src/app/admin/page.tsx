
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { 
    Users, 
    TrendingUp, 
    Zap, 
    Mail, 
    FileText, 
    AlertTriangle, 
    MessageSquare, 
    ArrowUpRight, 
    Activity, 
    ShieldCheck, 
    Clock, 
    Crown, 
    ArrowDownRight,
    Search,
    ChevronRight,
    Sparkles,
    BarChart3,
    Box,
    Terminal,
    ArrowRight,
    Cpu,
    Globe,
    Bell,
    Smartphone,
    HandHelping,
    Scale,
    LayoutGrid,
    Flame,
    ZapOff,
    CheckCircle2,
    Plus,
    Filter,
    Layers,
    History,
    Settings2,
    DollarSign,
    Target,
    FileSearch,
    BrainCircuit,
    Presentation as MonitorPlay,
    Trophy,
    Book
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIUsageMetricsAction } from '@/app/actions';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
} from 'recharts';

// --- Improved Components for Clarity ---

const MiniStat = ({ label, value, trend, icon: Icon, color, loading }: any) => (
    <div className="flex flex-col gap-2 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group">
        <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && (
                <span className={`text-[10px] font-black ${parseFloat(trend) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {parseFloat(trend) >= 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">{label}</p>
            <div className="text-2xl font-black text-slate-900 serif mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-200" /> : value}
            </div>
        </div>
    </div>
);

const UserActivityItem = ({ activity, idx }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="group flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100"
    >
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
            {activity.userName?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
                {activity.userName} <span className="font-medium text-slate-500">{activity.actionText}</span>
            </p>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />
                {activity.createdAt?.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
    </motion.div>
);

// --- Main Page ---

export default function AdminOverviewPage() {
    const { user: currentUser, userProfile } = useApp();
    const firestore = useFirestore();
    
    // Firestore Data - Only run if admin to avoid permission errors
    const isAdmin = userProfile?.role === 'admin';
    
    const usersQuery = useMemoFirebase(() => (firestore && isAdmin ? query(collection(firestore, 'users')) : null), [firestore, isAdmin]);
    const { data: users, isLoading: isUsersBatchLoading } = useCollection<any>(usersQuery);

    const aiUsageRef = useMemoFirebase(() => (firestore && isAdmin ? doc(firestore, 'stats', 'ai_usage') : null), [firestore, isAdmin]);
    const { data: aiUsage, isLoading: isUsageLoading } = useDoc(aiUsageRef);

    const activitiesQuery = useMemoFirebase(() => (
        firestore && isAdmin ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(8)) : null
    ), [firestore, isAdmin]);
    const { data: activities, isLoading: isActivitiesLoading } = useCollection(activitiesQuery);

    const [aiStats, setAiStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await getAIUsageMetricsAction();
                if (res.success) {
                    setAiStats(res);
                    if (res.history) setHistory(res.history);
                }
            } catch (err) {
                console.error("Failed to fetch admin dashboard data:", err);
            } finally { setIsAiLoading(false); }
        }
        fetchData();
    }, []);

    const stats = useMemo(() => {
        if (!users) return { totalUsers: 0, growth: '0', premiumPercentage: '0', aiCost: '0.00' };
        const nonAdmins = users.filter(u => u.role !== 'admin');
        const d30 = new Date(); d30.setDate(d30.getDate() - 30);
        const usersOlderThan30d = nonAdmins.filter(u => {
            const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
            return createdAt && createdAt < d30;
        }).length;
        const growth = usersOlderThan30d > 0 ? ((nonAdmins.length - usersOlderThan30d) / usersOlderThan30d * 100).toFixed(1) : '100';
        const inputCostDkkPerMillion = 0.075 * 7.0; // 0.525 kr
        const outputCostDkkPerMillion = 0.30 * 7.0; // 2.10 kr
        const aiCost = (((aiUsage?.totalInputTokens || 0) / 1000000 * inputCostDkkPerMillion) + ((aiUsage?.totalOutputTokens || 0) / 1000000 * outputCostDkkPerMillion));
        const premiumCount = nonAdmins.filter(u => u.membership && u.membership !== 'free').length;
        const premiumPercentage = nonAdmins.length > 0 ? ((premiumCount / nonAdmins.length) * 100).toFixed(1) : '0';
        
        return { 
            totalUsers: nonAdmins.length, 
            growth, 
            aiCost: aiCost.toFixed(2), 
            premiumPercentage
        };
    }, [users, aiUsage]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20">
            
            {/* 1. Header: Status & Quick Actions */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/20">
                        <Box className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Kommando-Pult</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Status: <span className="text-emerald-500">Operativ</span> • v4.8.2
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100">
                    <div className="relative group hidden sm:block">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                         <input type="text" placeholder="Hurtig søgning..." className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all w-64" />
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <Link href="/admin/notifications" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-sm">
                            <Bell className="w-5 h-5" />
                        </Link>
                        <Link href="/admin/system" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-sm">
                            <Settings2 className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <MiniStat label="Total Brugere" value={stats.totalUsers.toLocaleString('da-DK')} trend={stats.growth} icon={Users} color="bg-slate-50 text-slate-600" loading={isUsersBatchLoading} />
                <MiniStat label="Premium Rate" value={`${stats.premiumPercentage}%`} trend="+2" icon={Crown} color="bg-indigo-50 text-indigo-600" loading={isUsersBatchLoading} />
                <MiniStat label="AI Burn" value={`${Math.round(parseFloat(stats.aiCost))} kr.`} trend="-3" icon={Flame} color="bg-rose-50 text-rose-600" loading={isUsageLoading} />
                <MiniStat label="Platform Puls" value="99.9%" trend="±0" icon={Activity} color="bg-emerald-50 text-emerald-600" loading={false} />
                <MiniStat label="System Health" value="Operativ" trend="OK" icon={ShieldCheck} color="bg-blue-50 text-blue-600" loading={false} />
            </div>

            {/* 3. Primary Workspace: Analytics & Real-time Flow */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Main Graph Card */}
                <div className="lg:col-span-8">
                    <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full group">
                        <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><BarChart3 className="w-5 h-5" /></div>
                                <h3 className="text-xl font-black text-slate-900 serif tracking-tight">AI-Aktivitets Moment</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">30 dages historik</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div className="p-10 flex-1 h-[400px] min-h-[400px] w-full">
                            <ResponsiveContainer width="100%" height={400} minWidth={0}>
                                <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="10 10" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={20} tickFormatter={(v) => v.toUpperCase()} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px', backgroundColor: '#0f172a' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '9px', fontWeight: '900' }}
                                    />
                                    <Area type="monotone" dataKey="usage" stroke="#4f46e5" strokeWidth={5} fill="url(#chartGrad)" animationDuration={2000} strokeLinecap="round" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-50 grid grid-cols-3 gap-8">
                             <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Momentum</p>
                                 <p className="text-xl font-black text-slate-900 serif">+42.8</p>
                             </div>
                             <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                                 <p className="text-xl font-black text-emerald-600 serif">99.9%</p>
                             </div>
                              <div className="text-center">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tokens (30d)</p>
                                  <p className="text-xl font-black text-indigo-600 serif">
                                      {(() => {
                                          if (!aiUsage) return '0';
                                          const total = aiUsage.totalInputTokens + aiUsage.totalOutputTokens;
                                          if (total >= 1000000) return `${(total / 1000000).toFixed(1)}m`;
                                          if (total >= 1000) return `${Math.round(total / 1000)}k`;
                                          return total.toLocaleString('da-DK');
                                      })()} <small className="text-[10px]">tokens</small>
                                  </p>
                              </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Activity Card */}
                <div className="lg:col-span-4">
                    <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 serif flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-600" /> Systemuls
                            </h3>
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-full">Live</div>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                            {isActivitiesLoading ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                            ) : (
                                (() => {
                                    const adminIds = new Set(users?.filter(u => u.role === 'admin').map(u => u.uid));
                                    const studentActivities = activities?.filter((act: any) => !adminIds.has(act.userId)) || [];
                                    return studentActivities.map((act: any, idx: number) => <UserActivityItem key={act.id} activity={act} idx={idx} />);
                                })()
                            )}
                        </div>
                        <Link href="/admin/activity" className="p-6 bg-slate-50 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all">
                            Se alle aktiviteter <ArrowRight className="w-3 h-3 inline ml-1" />
                        </Link>
                    </section>
                </div>
            </div>

            {/* 4. Strategic Navigation: Symmetrical Control Center Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm"><LayoutGrid className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-black text-slate-900 serif">Kontrolpanel & Værktøjer</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <NexusCard title="Brugeraktivitet" icon={Activity} color="text-indigo-600" bg="bg-indigo-50" href="/admin/activity" desc="Realtids hændelseslog & overvågning" />
                    <NexusCard title="Korrektur" icon={FileText} color="text-amber-800" bg="bg-amber-50" href="/admin/korrektur" desc="Kalkulator, Lead-styring & afregning" />
                    <NexusCard title="Digitaliser Bøger" icon={Book} color="text-emerald-600" bg="bg-emerald-50" href="/admin/books" desc="AI-indlæsning af indholdsfortegnelser" />
                    <NexusCard title="Begreber" icon={BrainCircuit} color="text-emerald-700" bg="bg-emerald-50" href="/admin/begreber" desc="AI Begrebsguide & vidensbase" />
                    
                    <NexusCard title="Case Analyser" icon={FileSearch} color="text-rose-600" bg="bg-rose-50" href="/admin/case-analyser" desc="Bruger-sagsakter & AI-indsigter" />
                    <NexusCard title="Seminarer" icon={MonitorPlay} color="text-purple-600" bg="bg-purple-50" href="/admin/seminarer" desc="Litteratur, slides & upload-logs" />
                    <NexusCard title="Email Broadcast" icon={Mail} color="text-blue-600" bg="bg-blue-50" href="/admin/email" desc="Skabeloner & udsendelse via Resend" />
                    <NexusCard title="Notifikationer" icon={Smartphone} color="text-cyan-600" bg="bg-cyan-50" href="/admin/notifications" desc="Mobil push-notifikationer & alarmer" />
                    
                    <NexusCard title="Kampagner" icon={Sparkles} color="text-amber-500" bg="bg-amber-50" href="/admin/marketing" desc="Rabatkoder, kampagnebannere & SEO" />
                    <NexusCard title="Konkurrence" icon={Trophy} color="text-rose-500" bg="bg-rose-50" href="/admin/konkurrence" desc="Deltagere, streaks & journey-data" />
                    <NexusCard title="Uddannelse" icon={BarChart3} color="text-indigo-500" bg="bg-indigo-50" href="/admin/education" desc="Studieordninger, moduler & progression" />
                    <NexusCard title="Surveys" icon={MessageSquare} color="text-teal-600" bg="bg-teal-50" href="/admin/surveys" desc="Brugerfeedback, NPS & anmeldelser" />
                </div>
            </div>

            {/* 5. Minimal Insight Panel */}
            <section className="bg-slate-900 text-white rounded-[4rem] p-12 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                     <div className="flex items-center gap-8">
                         <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-4xl serif font-black">4.9</div>
                         <div>
                             <h4 className="text-2xl font-black serif">Platfom-Trivsel</h4>
                             <p className="text-sm text-white/40 font-medium italic mt-1">Aggregeret score fra 1.250+ uafhængige surveys.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">NPS Score</p>
                            <p className="text-3xl font-black">+76</p>
                         </div>
                         <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Retention</p>
                            <p className="text-3xl font-black">96%</p>
                         </div>
                     </div>
                 </div>
            </section>
        </div>
    );
}

const NexusCard = ({ title, icon: Icon, color, bg, href, desc }: any) => (
    <Link href={href} className="group p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-500 flex flex-col gap-4 h-full">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} transition-transform group-hover:scale-110 duration-500`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-lg font-black text-slate-900 serif leading-none mb-1.5">{title}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{desc}</p>
        </div>
    </Link>
);

