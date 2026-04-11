
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Crown, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Loader2,
  Zap,
  Target,
  Rocket,
  BrainCircuit,
  Boxes,
  ArrowRight,
  ChevronRight,
  Users
} from 'lucide-react';

import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceDot
} from 'recharts';
import { getStripeDashboardMetricsAction, getStripeHistoricalRevenueAction, syncAllSubscriptionsAction, getSystemLogsAction, getLiveMarketAnalysisAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// --- Improved Components ---

const PaymentSyncLog = ({ log }: { log: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusColors = {
        'running': 'bg-amber-50 text-amber-600 border-amber-100',
        'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'completed_with_errors': 'bg-rose-50 text-rose-600 border-rose-100'
    }[log.status as string] || 'bg-slate-50 text-slate-600 border-slate-100';

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-5">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColors}`}>
                        {log.status === 'completed_with_errors' ? 'Færdig med fejl' : log.status === 'completed' ? 'Færdig' : 'Kører...'}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">
                            {new Date(log.startTime).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Sync</p>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Processed</p><p className="text-sm font-black text-slate-900">{log.processedCount || 0}</p></div>
                    <div className="text-center"><p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Errors</p><p className="text-sm font-black text-rose-600">{log.errorCount || 0}</p></div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && log.details && log.details.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-50 bg-slate-50/50 p-6">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                            {log.details.map((detail: string, i: number) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white text-[11px] font-medium font-mono text-slate-600">
                                    {detail}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function AdminFinansPage() {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();

    const [metrics, setMetrics] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [growthRate, setGrowthRate] = useState(15); 
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [liveAnalysis, setLiveAnalysis] = useState<any>(null);
    const [platformAssetValue, setPlatformAssetValue] = useState(5000000); 

    const platformFeatures = [
        { id: 'legal_ai', name: 'Legal AI Suite', description: 'Analyser & Decision Support', marketValue: 1850000 },
        { id: 'edtech_suite', name: 'EdTech Architect', description: 'Exam & Training Ecosystem', marketValue: 1250000 },
        { id: 'gov_live', name: 'Legal Monitoring', description: 'Live Intelligence & Indexing', marketValue: 950000 },
        { id: 'marketplace', name: 'Justice Marketplace', description: 'Collaboration Task Hub', marketValue: 450000 },
        { id: 'infrastructure', name: 'Internal IP/System', description: 'Core Engine & Architecture', marketValue: 650000 }
    ];

    const [stratScores, setStratScores] = useState({
        technology: 5, architecture: 5, ip: 5, team: 4, data: 5
    });

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (!isUserLoading && (!user || userProfile?.role !== 'admin')) router.replace('/portal');
    }, [user, userProfile, isUserLoading, router]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [mRes, hRes] = await Promise.all([
                    getStripeDashboardMetricsAction(),
                    getStripeHistoricalRevenueAction()
                ]);
                if (mRes.success) setMetrics(mRes);
                if (hRes.success && hRes.data) setHistory(hRes.data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        }
        async function fetchLogs() {
            setIsLogsLoading(true);
            try {
                const res = await getSystemLogsAction('payment_sync', 10);
                if (res.success && res.data) setSyncLogs(res.data);
            } catch (err) { console.error(err); } finally { setIsLogsLoading(false); }
        }
        fetchData(); fetchLogs();
    }, []);

    const projections = useMemo(() => {
        if (!metrics || !history.length) return [];
        const baseMRR = metrics.mrr;
        const result = [...history.slice(-4)].map(h => ({ ...h, isExamMonth: false })); 
        let currentMRR = baseMRR;
        const examMonths = [0, 5]; 
        for (let i = 1; i <= 12; i++) {
            const date = new Date(); date.setMonth(date.getMonth() + i);
            const isExamMonth = examMonths.includes(date.getMonth());
            const monthlyGrowth = (growthRate / 100 / 12);
            const boost = isExamMonth ? 1.6 : 1.0;
            currentMRR = currentMRR * (1 + (monthlyGrowth * boost));
            result.push({ 
                name: date.toLocaleString('da-DK', { month: 'short', year: '2-digit' }).toUpperCase(), 
                revenue: null, projected: currentMRR, isExamMonth
            });
        }
        return result;
    }, [metrics, history, growthRate]);

    const examPeriodImpact = useMemo(() => {
        const exams = projections.filter(p => p.isExamMonth && p.projected);
        if (exams.length === 0) return null;
        const nextExam = exams[0];
        const prevMonth = projections[projections.indexOf(nextExam) - 1];
        return {
            growth: prevMonth?.projected ? ((nextExam.projected - prevMonth.projected) / prevMonth.projected) * 100 : 0
        };
    }, [projections]);

    const milestones = useMemo(() => {
        if (!metrics) return [];
        const targets = [50000, 100000, 250000, 500000];
        const currentMRR = metrics.mrr;
        const avgPrice = metrics.mrr / (metrics.activeSubs || 1);
        return targets.map(t => {
            if (currentMRR >= t) return { target: t, status: 'reached', date: 'Opnået', progress: 100 };
            const months = Math.log(t / currentMRR) / Math.log(1 + growthRate / 100 / 12);
            const date = new Date(); date.setMonth(date.getMonth() + Math.ceil(months));
            return {
                target: t, status: 'pending', date: date.toLocaleString('da-DK', { month: 'short', year: '2-digit' }).toUpperCase(),
                usersNeeded: Math.ceil((t - currentMRR) / (avgPrice || 299)),
                progress: (currentMRR / t) * 100
            };
        });
    }, [metrics, growthRate]);

    const handleSyncSubscriptions = async () => {
        setIsSyncing(true);
        try {
            const res = await syncAllSubscriptionsAction();
            if (res.success) {
                const mRes = await getStripeDashboardMetricsAction();
                if (mRes.success) setMetrics(mRes);
                alert(res.message);
            }
        } finally { setIsSyncing(false); }
    };

    const handleLiveAnalysis = async () => {
        setIsAnalyzing(true); setLiveAnalysis(null);
        try {
            const res = await getLiveMarketAnalysisAction({
                features: platformFeatures.map(f => f.name),
                currentArr: metrics?.arr || 0,
                strategicScores: stratScores
            });
            if (res) {
                setLiveAnalysis(res);
                if (res.estimatedAssetValue) setPlatformAssetValue(res.estimatedAssetValue);
            }
        } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
    };

    if (isUserLoading || !userProfile || userProfile.role !== 'admin') return <AuthLoadingScreen />;

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 animate-ink pb-20 pt-8 px-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <header className="xl:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-110 duration-500 transition-all active:scale-95 shadow-xl shadow-slate-900/20">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-400 shadow-lg shadow-indigo-600/20">FINANCE / CORE INTELLIGENCE</div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-slate-900 serif tracking-tight">Værdiansættelse</h1>
                        <p className="text-lg text-slate-500 font-medium italic mt-2">Strategisk overblik over enterprise værdi, omsætning & markeds-moat.</p>
                    </div>
                </header>

                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                    <div className="p-8 bg-slate-950 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-slate-800">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
                            <Crown className="w-32 h-32 text-amber-400" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Enterprise Valuation
                                </p>
                                <p className="text-4xl font-black text-white serif tracking-tighter">
                                    {metrics ? `${Math.round(metrics.arr * (liveAnalysis?.marketMultiplier || 8) + platformAssetValue).toLocaleString('da-DK')} DKK` : '---'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black text-white/40 uppercase tracking-tighter">Multiplier: {liveAnalysis?.marketMultiplier || 8}x ARR</span>
                                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[8px] font-black text-white/40 uppercase tracking-tighter">Asset: {Math.round(platformAssetValue / 1000000 * 10) / 10}M DKK</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={handleSyncSubscriptions} disabled={isSyncing} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:bg-slate-50 transition-all flex items-center justify-between group active:scale-95 disabled:opacity-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:rotate-12 transition-all">
                                    {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                </div>
                                <span className="text-[11px] font-black uppercase text-slate-900">Sync Betalinger</span>
                            </div>
                        </button>
                        <button onClick={handleLiveAnalysis} disabled={isAnalyzing} className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-between group active:scale-95 disabled:opacity-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-all">
                                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest">AI Markedsanalyse</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="MRR (Realtid)" value={metrics ? `${Math.round(metrics.mrr).toLocaleString('da-DK')} DKK` : '---'} trend="+1.2%" icon={TrendingUp} color="bg-blue-50 text-blue-600" />
                <StatCard title="ARR (Løbende)" value={metrics ? `${Math.round(metrics.arr).toLocaleString('da-DK')} DKK` : '---'} trend="+14.5%" icon={Rocket} color="bg-indigo-50 text-indigo-600" />
                <StatCard title="Net Revenue (30d)" value={metrics ? `${Math.round(metrics.netRevenue30d).toLocaleString('da-DK')} DKK` : '---'} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
                <StatCard title="Aktive Brugere" value={metrics?.activeSubs || 0} icon={Users} color="bg-slate-50 text-slate-900" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 serif">Vækst-Momentum</h3>
                                <p className="text-sm text-slate-400 font-medium">Inkluderer seasonal boost for danske eksamensmåneder (Jun/Jan).</p>
                            </div>
                            <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 items-center justify-between gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Vækstrate:</span>
                                <div className="flex gap-1">
                                    {[5, 10, 20, 40].map(r => (
                                        <button key={r} onClick={() => setGrowthRate(r)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${growthRate === r ? 'bg-white text-indigo-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                            {r}% 
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="h-[500px] w-full relative min-h-[500px]">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={projections} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                                        <Area type="monotone" dataKey="projected" stroke="#6366f1" strokeWidth={5} strokeDasharray="10 10" fillOpacity={0} animationDuration={2000} />
                                        {projections.map((entry, index) => entry.isExamMonth ? <ReferenceDot key={index} x={entry.name} y={entry.projected || entry.revenue} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={3} /> : null )}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-all"><Target className="w-24 h-24 text-white" /></div>
                            <h4 className="text-xl font-black serif mb-8">Næste Milestone</h4>
                            {milestones.find(m => m.status === 'pending') && (
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-4xl font-black serif tracking-tight">{milestones.find(m => m.status === 'pending')!.target.toLocaleString('da-DK')} DKK</p>
                                            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mt-1">Estimering: {milestones.find(m => m.status === 'pending')!.date}</p>
                                        </div>
                                        <p className="text-2xl font-black text-white/40 serif italic">8{Math.round(milestones.find(m => m.status === 'pending')!.progress)}%</p>
                                    </div>
                                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${milestones.find(m => m.status === 'pending')!.progress}%` }} className="h-full bg-white" />
                                    </div>
                                </div>
                            )}
                        </section>
                        <section className="bg-slate-950 p-10 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden border border-slate-800">
                             <div className="flex justify-between items-center"><h4 className="text-xl font-black serif">System Audit Log</h4><Activity className="w-5 h-5 text-slate-600" /></div>
                             <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                                {syncLogs.slice(0, 5).map((log, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${log.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg shadow-current/50`} />
                                            <p className="text-[10px] font-bold text-slate-300">{new Date(log.startTime).toLocaleDateString('da-DK')}</p>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{log.processedCount} users</p>
                                    </div>
                                ))}
                             </div>
                        </section>
                    </div>
                </div>

                <div className="space-y-12">
                    <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 group overflow-hidden relative">
                         <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:scale-110 duration-1000 transition-all"><Boxes className="w-64 h-64 text-indigo-900" /></div>
                         <div className="relative z-10 flex items-center justify-between">
                            <div><h3 className="text-2xl font-black text-slate-900 serif">Platform-Assets</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Beregnet unik markedspris</p></div>
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {platformFeatures.map(f => (
                                <div key={f.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group/feat duration-500">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[11px] font-black text-slate-900">{f.name}</p>
                                        <p className="text-[10px] font-black text-indigo-600 italic tracking-tighter">{Math.round(f.marketValue).toLocaleString('da-DK')} DKK</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic group-hover/feat:text-slate-500">{f.description}</p>
                                </div>
                            ))}
                         </div>
                    </section>

                    <section className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 space-y-10 group hover:bg-white hover:shadow-2xl transition-all duration-700">
                         <div><h4 className="text-xl font-black text-slate-900 serif italic">Strategiske Faktorer</h4><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Værdiansættelse & Moat</p></div>
                         <div className="space-y-6">
                            {[
                                { key: 'technology', label: '🧠 Teknologi' }, { key: 'ip', label: '🔐 IP Rettigheder' }, { key: 'data', label: '📊 Unik Data' }, { key: 'team', label: '👥 Team Drift' }, { key: 'architecture', label: '⚙️ Arkitektur' },
                            ].map((s) => (
                                <div key={s.key} className="space-y-3">
                                    <div className="flex justify-between items-end"><p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{s.label}</p><span className="text-[10px] font-black text-indigo-600">{stratScores[s.key as keyof typeof stratScores]}/5</span></div>
                                    <div className="flex gap-1.5">
                                        {[1,2,3,4,5].map(v => (
                                            <button key={v} onClick={() => setStratScores(prev => ({ ...prev, [s.key]: v }))} className={`flex-1 h-2 rounded-full transition-all duration-500 ${stratScores[s.key as keyof typeof stratScores] >= v ? 'bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </section>
                </div>
            </div>

            <AnimatePresence>
                {(isAnalyzing || liveAnalysis) && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                        <section className="bg-slate-950 p-12 rounded-[5rem] border border-indigo-500/30 shadow-3xl shadow-indigo-500/10 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Rocket className="w-64 h-64 text-indigo-400 rotate-12" /></div>
                             <div className="flex flex-col md:flex-row items-center gap-8 mb-16 relative z-10">
                                <div className="p-6 bg-indigo-600 rounded-[2.5rem] shadow-2xl animate-pulse"><BrainCircuit className="w-10 h-10 text-white" /></div>
                                <div className="text-center md:text-left"><h3 className="text-4xl font-black text-white serif tracking-tight">AI Intelligence Console</h3><p className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mt-2 italic">Analyse Færdig — Strategisk Opsamling</p></div>
                             </div>

                             {isAnalyzing ? (
                                <div className="py-24 flex flex-col items-center gap-8">
                                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Scanner globale SaaS multiplikatorer & 2026 trends...</p>
                                </div>
                             ) : (
                                <div className="space-y-16 animate-ink relative z-10">
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                        {/* 1. SUMMARY (OPSUMMERING) */}
                                        <div className="xl:col-span-2 space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">01</div>
                                                <h4 className="text-xl font-black text-white serif italic uppercase tracking-widest">Strategisk Opsummering</h4>
                                            </div>
                                            <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 backdrop-blur-2xl">
                                                <div className="text-indigo-100/90 leading-loose italic whitespace-pre-wrap font-medium prose prose-invert prose-sm max-w-none">
                                                    {liveAnalysis.report}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. CALCULATIONS (MELLEMREGNINGER) */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">02</div>
                                                <h4 className="text-xl font-black text-white serif italic uppercase tracking-widest">Mellemregninger</h4>
                                            </div>
                                            <div className="p-10 bg-indigo-600 rounded-[3rem] shadow-2xl space-y-8 border border-white/10 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all duration-1000"><DollarSign className="w-24 h-24 text-white" /></div>
                                                
                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex justify-between items-start pb-4 border-b border-white/10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Indtjeningsværdi</p>
                                                            <p className="text-xs text-white/60 font-medium">{Math.round(metrics?.arr || 0).toLocaleString('da-DK')} ARR x {liveAnalysis.marketMultiplier}x</p>
                                                        </div>
                                                        <p className="text-lg font-black text-white">{Math.round((metrics?.arr || 0) * liveAnalysis.marketMultiplier).toLocaleString('da-DK')} DKK</p>
                                                    </div>

                                                    <div className="flex justify-between items-start pb-4 border-b border-white/10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Platform Assets</p>
                                                            <p className="text-xs text-white/60 font-medium">Replacement Cost (AI Est.)</p>
                                                        </div>
                                                        <p className="text-lg font-black text-white">{Math.round(platformAssetValue).toLocaleString('da-DK')} DKK</p>
                                                    </div>

                                                    <div className="pt-4 flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Total Valuation</p>
                                                            <p className="text-[9px] text-white/40 font-black italic uppercase">Beregnet Enterprise Værdi</p>
                                                        </div>
                                                        <p className="text-3xl font-black text-white serif tracking-tighter">
                                                            {Math.round((metrics?.arr || 0) * (liveAnalysis.marketMultiplier) + platformAssetValue).toLocaleString('da-DK')} DKK
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Beslutningsgrundlag</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/5 rounded-xl text-indigo-400"><Target className="w-5 h-5" /></div>
                                                    <p className="text-[10px] text-white/60 leading-relaxed italic">Vurderingen vægter teknologi-moat (Score: {stratScores.technology}/5) over ren omsætning.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. BENCHMARKS */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-[10px] font-black text-white">03</div>
                                            <h4 className="text-xl font-black text-white serif italic uppercase tracking-widest">Konkurrent Benchmarks</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {liveAnalysis.competitorBenchmarks?.map((b: any, i: number) => (
                                                <div key={i} className="p-10 bg-white/5 rounded-[3rem] border border-white/5 hover:border-indigo-500/50 transition-all hover:bg-white/10 group/c backdrop-blur-sm">
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">{b.name}</p>
                                                    <p className="text-2xl font-black text-white serif mb-3">{b.estimatedValue}</p>
                                                    <div className="h-1px w-12 bg-white/10 mb-4 group-hover/c:w-full transition-all duration-500" />
                                                    <p className="text-[11px] text-white/40 italic font-medium leading-relaxed group-hover/c:text-white/60">{b.featureOverlap}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="space-y-10 pt-10 border-t border-slate-50">
                <div className="flex items-center px-4 gap-5">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl"><Activity className="w-7 h-7" /></div>
                    <div><h3 className="text-3xl font-black text-slate-900 serif">Betalingssync Historik</h3><p className="text-sm text-slate-400 font-medium italic">Oversigt over automatiske og manuelle system-synkroniseringer.</p></div>
                </div>
                <div className="space-y-6">
                    {syncLogs.length === 0 ? (
                        <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                            <Activity className="w-10 h-10 text-slate-200" /><p className="text-xl font-bold text-slate-400 serif">Ingen log-historik fundet</p>
                        </div>
                    ) : (
                        syncLogs.map((log) => <PaymentSyncLog key={log.id} log={log} />)
                    )}
                </div>
            </section>
        </div>
    );
}

const StatCard = ({ title, value, trend, icon: Icon, color, loading }: any) => (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 mb-8 ${color} shadow-lg shadow-current/10`}>
            <Icon className="w-7 h-7" />
        </div>
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{title}</p>
                {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
            </div>
            <div className="text-3xl font-black text-slate-900 serif tracking-tight">
                {loading ? <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-lg" /> : value}
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-3xl">
                <div className="flex items-center gap-3 mb-4"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{payload[0].payload.name}</p></div>
                <div className="space-y-3">
                    {payload[0].value && (
                        <div><p className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Faktisk MRR</p><p className="text-xl font-black text-white italic">{Math.round(payload[0].value).toLocaleString('da-DK')} DKK</p></div>
                    )}
                    {payload[1]?.value && (
                        <div><p className="text-[9px] font-black text-indigo-300 uppercase tracking-tighter">Prognose</p><p className="text-xl font-black text-emerald-400 italic">{Math.round(payload[1].value).toLocaleString('da-DK')} DKK</p></div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};
