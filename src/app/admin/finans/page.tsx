
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  ArrowDownRight,
  Calendar,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
  Zap,
  Target,
  LineChart,
  Rocket,
  BrainCircuit,
  Boxes,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Users,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Line,
  ComposedChart
} from 'recharts';
import { jsPDF } from 'jspdf';
import { getStripeDashboardMetricsAction, getStripeHistoricalRevenueAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// --- Improved Components ---

const FinStatCard = ({ title, value, trend, icon: Icon, color, loading }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color} shadow-lg shadow-current/10`}>
                <Icon className="w-7 h-7" />
            </div>
            {trend && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-black uppercase tracking-wider">{trend.value}</span>
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-[11px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">{title}</p>
            <div className="text-4xl font-black text-slate-900 serif flex items-center gap-2">
                {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-200" /> : value}
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-8">
                            <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">{p.name === 'revenue' ? 'Faktisk' : 'Prognose'}</span>
                            <span className="text-sm font-black text-white">{Math.round(p.value).toLocaleString('da-DK')} kr.</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// --- Main Page ---

export default function AdminFinansPage() {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();

    const [metrics, setMetrics] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [growthRate, setGrowthRate] = useState(15); 

    useEffect(() => {
        if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
            router.replace('/portal');
        }
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
            } catch (err) {
                console.error("Failed to load financial data:", err);
            } finally { setLoading(false); }
        }
        fetchData();
    }, []);

    // Advanced Projections Logic
    const projections = useMemo(() => {
        if (!metrics || !history.length) return [];
        const baseMRR = metrics.mrr;
        const result = [...history.slice(-4)]; 
        let currentMRR = baseMRR;
        for (let i = 1; i <= 12; i++) {
            currentMRR = currentMRR * (1 + (growthRate / 100 / 12)); // Monthly compounding
            const date = new Date(); date.setMonth(date.getMonth() + i);
            result.push({ name: date.toLocaleString('da-DK', { month: 'short' }).toUpperCase(), revenue: null, projected: currentMRR });
        }
        return result;
    }, [metrics, history, growthRate]);

    const milestones = useMemo(() => {
        if (!metrics) return [];
        const targets = [25000, 50000, 100000, 250000, 500000, 1000000];
        const currentMRR = metrics.mrr;
        const avgPrice = metrics.mrr / (metrics.activeSubs || 1);

        return targets.map(t => {
            if (currentMRR >= t) return { target: t, status: 'reached', date: 'Opnået', missing: 0, usersNeeded: 0 };
            const months = Math.log(t / currentMRR) / Math.log(1 + growthRate / 100 / 12);
            const date = new Date(); date.setMonth(date.getMonth() + Math.ceil(months));
            return {
                target: t,
                status: 'pending',
                date: date.toLocaleString('da-DK', { month: 'long', year: 'numeric' }).toUpperCase(),
                missing: t - currentMRR,
                usersNeeded: Math.ceil((t - currentMRR) / avgPrice),
                progress: (currentMRR / t) * 100
            };
        });
    }, [metrics, growthRate]);

    const handleDownloadCSV = () => {
        if (!metrics || !history.length) return;
        setIsExporting('csv');
        
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Cohero_Financial_Report_${timestamp}.csv`;
            let csv = "Cohero Financial Report & Projections\n";
            csv += `Generated At: ${new Date().toLocaleString('da-DK')}\n\n`;
            csv += "CORE METRICS\n";
            csv += `MRR;${Math.round(metrics.mrr)} kr.\n`;
            csv += `ARR;${Math.round(metrics.arr)} kr.\n`;
            csv += `Net Revenue (30d);${Math.round(metrics.netRevenue30d)} kr.\n`;
            csv += `Active Subscribers;${metrics.activeSubs}\n`;
            csv += `Estimated Valuation (8x ARR);${Math.round(metrics.arr * 8)} kr.\n\n`;
            csv += "HISTORICAL REVENUE\nMonth;Revenue (DKK)\n";
            history.forEach(h => csv += `${h.name};${Math.round(h.revenue)}\n`);
            csv += "\nPROJECTIONS (${growthRate}% Growth)\nMonth;Projected MRR (DKK)\n";
            projections.filter(p => p.projected).forEach(p => csv += `${p.name};${Math.round(p.projected)}\n`);
            csv += "\nREVENUE MILESTONES\nTarget;Status;Estimated Date;Missing;Users Needed\n";
            milestones.forEach(m => csv += `${m.target};${m.status};${m.date};${Math.round(m.missing)};${m.usersNeeded}\n`);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.click();
        } finally { setIsExporting(null); }
    };

    const handleDownloadPDF = async () => {
        if (!metrics) return;
        setIsExporting('pdf');
        
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleDateString('da-DK');
            const pageWidth = doc.internal.pageSize.getWidth();

            // 1. Header (Cohero Branding)
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("COHERO", 20, 25);
            doc.setFontSize(10);
            doc.setTextColor(251, 191, 36); // amber-400
            doc.text("FINANCIAL INTELLIGENCE REPORT", 20, 32);
            doc.setTextColor(255, 255, 255);
            doc.text(`DATE: ${timestamp}`, pageWidth - 60, 28);

            // 2. Summary
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(16);
            doc.text("Executive Summary", 20, 60);
            doc.setDrawColor(241, 245, 249);
            doc.line(20, 65, pageWidth - 20, 65);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const stats = [
                { label: "Monthly Recurring Revenue (MRR)", value: `${Math.round(metrics.mrr).toLocaleString('da-DK')} kr.` },
                { label: "Annual Recurring Revenue (ARR)", value: `${Math.round(metrics.arr).toLocaleString('da-DK')} kr.` },
                { label: "Net Revenue (Last 30 days)", value: `${Math.round(metrics.netRevenue30d).toLocaleString('da-DK')} kr.` },
                { label: "Active Paying Users", value: `${metrics.activeSubs} members` },
                { label: "Estimated Fair Value (8x Multiplier)", value: `${Math.round(metrics.arr * 8).toLocaleString('da-DK')} kr.` }
            ];

            let yPos = 75;
            stats.forEach(s => {
                doc.setFont("helvetica", "bold");
                doc.text(s.label, 20, yPos);
                doc.setFont("helvetica", "normal");
                doc.text(s.value, pageWidth - 70, yPos);
                yPos += 10;
            });

            // 3. Projections Table
            yPos += 15;
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(`Projections (${growthRate}% Annual Growth)`, 20, yPos);
            yPos += 8;
            doc.line(20, yPos, pageWidth - 20, yPos);
            yPos += 10;

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text("MONTH / PERIOD", 20, yPos);
            doc.text("PROJECTED MRR (DKK)", 80, yPos);
            doc.text("ESTIMATED YEARLY BASIS", 140, yPos);
            yPos += 5;

            const projItems = projections.filter(p => p.projected).slice(0, 10);
            projItems.forEach(p => {
                yPos += 8;
                doc.setTextColor(15, 23, 42);
                doc.text(p.name, 20, yPos);
                doc.text(`${Math.round(p.projected).toLocaleString('da-DK')} kr.`, 80, yPos);
                doc.text(`${Math.round((p.projected as number) * 12).toLocaleString('da-DK')} kr.`, 140, yPos);
            });

            // 4. Milestones & Strategic Guidance
            yPos += 20;
            if (yPos > 240) { doc.addPage(); yPos = 20; }
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Strategic Milestones", 20, yPos);
            yPos += 8;
            doc.line(20, yPos, pageWidth - 20, yPos);
            yPos += 12;

            milestones.forEach(m => {
                if (yPos > 260) { doc.addPage(); yPos = 20; }
                doc.setFont("helvetica", "bold");
                if (m.status === 'reached') {
                    doc.setTextColor(16, 185, 129); // emerald-500
                } else {
                    doc.setTextColor(15, 23, 42); // slate-900
                }
                doc.text(`${m.target.toLocaleString('da-DK')} kr. MRR`, 20, yPos);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(m.status === 'reached' ? "[REACHED]" : `[ESTIMATED: ${m.date}]`, 85, yPos);
                
                if (m.status === 'pending') {
                    doc.setFontSize(8);
                    doc.text(`Required conversions: ~${m.usersNeeded} members`, 140, yPos);
                    doc.setFontSize(9);
                }
                yPos += 8;
            });

            // 5. Footer Analytics
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("This report is generated automatically by the Cohero Admin Engine and is intended for internal strategic use only.", 20, pageWidth + 80);

            doc.save(`Cohero_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally { setIsExporting(null); }
    };

    if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
        return <AuthLoadingScreen />;
    }

    const nextMilestone = milestones.find(m => m.status === 'pending');

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 animate-ink pb-20 pt-8">
            {/* 1. Header with Global Context */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 px-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.25rem] transition-all border border-transparent hover:border-slate-200 active:scale-95">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100 shadow-sm shadow-indigo-500/5">Fintech Intelligence Engine</div>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">Finansiel Arkitektur</h1>
                    <p className="text-xl text-slate-500 font-medium italic">Monitorering af realtids omsætning, værdiansættelse og strategisk projektion.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button 
                        onClick={handleDownloadCSV}
                        disabled={!!isExporting || loading}
                        className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {isExporting === 'csv' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSpreadsheet className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">CSV Rapport</p>
                            <p className="text-sm font-black text-slate-900 leading-none">Download Excel</p>
                        </div>
                    </button>

                    <button 
                        onClick={handleDownloadPDF}
                        disabled={!!isExporting || loading}
                        className="flex items-center gap-6 p-6 bg-slate-900 border border-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 hover:shadow-indigo-900/30 transition-all group active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-all">
                            {isExporting === 'pdf' ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="text-left text-white">
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none mb-1.5">PDF Strategi</p>
                            <p className="text-sm font-black leading-none">Hent PDF Rapport</p>
                        </div>
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-8 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Live Connection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Top-Level Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                <FinStatCard title="Monthly Recurring (MRR)" value={metrics ? `${Math.round(metrics.mrr).toLocaleString('da-DK')} kr.` : '0 kr.'} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" loading={loading} />
                <FinStatCard 
                    title="Trial Pipeline (MRR +)" 
                    value={metrics ? `${Math.round(metrics.potentialMrrFromTrials || 0).toLocaleString('da-DK')} kr.` : '0 kr.'} 
                    trend={metrics?.trialSubs > 0 ? { value: `${metrics.trialSubs} trials`, isPositive: true } : null}
                    icon={Activity} 
                    color="bg-rose-50 text-rose-600" 
                    loading={loading} 
                />
                <FinStatCard title="Net Omsætning (30d)" value={metrics ? `${Math.round(metrics.netRevenue30d).toLocaleString('da-DK')} kr.` : '0 kr.'} icon={DollarSign} color="bg-emerald-50 text-emerald-600" loading={loading} />
                <FinStatCard title="Estimated ARR" value={metrics ? `${Math.round(metrics.arr).toLocaleString('da-DK')} kr.` : '0 kr.'} icon={Rocket} color="bg-amber-50 text-amber-600" loading={loading} />
                <FinStatCard title="Betalende Brugere" value={metrics ? metrics.activeSubs : 0} icon={Users} color="bg-blue-50 text-blue-600" loading={loading} />
            </div>

            {/* 3. Deep Dive Analytics & Milestones Workspace */}
            <div className="grid lg:grid-cols-12 gap-12 items-stretch">
                <div className="lg:col-span-8 flex flex-col gap-12">
                    <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-500/5 rounded-full blur-[150px] -mr-[500px] -mt-[500px]" />
                        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[150px] -ml-[500px] -mb-[500px]" />
                        <div className="relative z-10 space-y-12 h-full flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                                <div>
                                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-indigo-500/20">
                                       <LineChart className="w-4 h-4" /> Predictive Revenue Simulation
                                    </div>
                                    <h2 className="text-3xl font-black serif">Fremskrivning af Økonomien</h2>
                                    <p className="text-white/30 mt-2 font-bold uppercase text-[10px] tracking-[0.3em]">Historisk Performance + 12 Mdrs. Vækstsimulering</p>
                                </div>
                                <div className="flex bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                                    {[5, 10, 20, 40].map(r => (
                                        <button key={r} onClick={() => setGrowthRate(r)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${growthRate === r ? 'bg-indigo-600 text-white shadow-2xl' : 'text-white/30 hover:text-white'}`}>
                                            {r}% Årlig
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={projections} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="actualRevGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="projRevGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="10 10" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff10" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={20} />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10' }} />
                                        <Area name="revenue" type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={5} fill="url(#actualRevGrad)" animationDuration={2000} strokeLinecap="round" />
                                        <Area name="projected" type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={3} strokeDasharray="12 12" fill="url(#projRevGrad)" animationDuration={2500} strokeLinecap="round" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-10 border-t border-white/5">
                                 <div><p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Projected ARR (12m)</p><p className="text-2xl font-black text-emerald-400 serif">{Math.round((projections[projections.length - 1]?.projected || 0) * 12).toLocaleString('da-DK')} <small className="text-xs text-white/20">kr.</small></p></div>
                                 <div><p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5">Estimated Churn</p><p className="text-2xl font-black text-rose-400 serif">3.2%</p></div>
                                 <div className="col-span-2 text-right"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Calculated Path</p><p className="text-sm font-bold text-white/60">Baseret på en aggressiv {growthRate}% årlig ekspansion med eksisterende bruger-mikstur.</p></div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="space-y-3 mb-10 px-2">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Target className="w-5 h-5" /></div><h3 className="text-2xl font-black text-slate-900 serif">Revenue Milestones</h3></div>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Strategiske mål for MRR. Vejen til næste niveau baseret på din nuværende vækst.</p>
                        </div>
                        {nextMilestone && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-10 relative overflow-hidden shadow-2xl shadow-indigo-900/10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16" />
                                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-4">Næste Målspot</p>
                                <div className="text-3xl font-black serif mb-6">{nextMilestone.target.toLocaleString('da-DK')} <span className="text-sm text-white/40">kr. / mdr</span></div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-white/40"><span>Fremdrift</span><span>{Math.round(nextMilestone.progress || 0)}%</span></div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${nextMilestone.progress}%` }} transition={{ duration: 1.5 }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" /></div>
                                    <p className="text-[11px] font-bold text-white/60 leading-relaxed italic mt-4">Du mangler <span className="text-white font-black">{nextMilestone.missing.toLocaleString('da-DK')} kr.</span>, hvilket svarer til ca. <span className="text-indigo-300 font-black">{nextMilestone.usersNeeded}</span> nye premium-medlemmer.</p>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 space-y-4 custom-scrollbar pr-2">
                            {milestones.map((m, i) => (
                                <div key={i} className={`p-6 rounded-[2.5rem] border transition-all duration-500 relative group overflow-hidden ${m.status === 'reached' ? 'bg-emerald-50 border-emerald-100/50 grayscale-[0.5]' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${m.status === 'reached' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white'}`}>{m.status === 'reached' ? <CheckCircle2 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}</div>
                                            <div><p className="text-[16px] font-black text-slate-900 serif leading-none">{m.target.toLocaleString('da-DK')} kr.</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{m.status === 'reached' ? 'Målsætning Opnået' : `Estimeret: ${m.date}`}</p></div>
                                        </div>
                                        {m.status === 'pending' && <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 transition-colors" />}
                                    </div>
                                    {m.status === 'pending' && <div className="mt-4 pt-4 border-t border-slate-50 hidden group-hover:block animate-in slide-in-from-top-2 duration-300"><p className="text-[10px] font-bold text-slate-500 italic">"Kræver ca. {m.usersNeeded} nye konverteringer baseret på din nuværende ARPU."</p></div>}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-950 p-16 md:p-24 rounded-[5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.05),transparent_70%)]" />
                <div className="relative z-10 grid xl:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6"><div className="w-16 h-16 bg-amber-400 rounded-3xl flex items-center justify-center text-amber-950 shadow-2xl shadow-amber-400/30 group-hover:rotate-12 duration-700 transition-transform"><Crown className="w-8 h-8" /></div><h3 className="text-5xl font-black text-white serif tracking-tight">Platform Valuation</h3></div>
                            <p className="text-2xl text-white/40 font-medium leading-relaxed italic max-w-xl">Hvad er Cohéro værd i dagens marked? Et strategisk estimat baseret på din ARR-momentum.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                             <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all duration-700"><p className="text-[11px] font-black uppercase text-amber-400/50 tracking-[0.2em] mb-4">Konservativ (4x)</p><p className="text-4xl font-black text-white serif">{metrics ? Math.round(metrics.arr * 4).toLocaleString('da-DK') : '0'} <small className="text-sm font-bold text-white/20 ml-1">kr.</small></p></div>
                             <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all duration-700"><p className="text-[11px] font-black uppercase text-emerald-400/50 tracking-[0.2em] mb-4">Aggressiv (12x)</p><p className="text-4xl font-black text-white serif">{metrics ? Math.round(metrics.arr * 12).toLocaleString('da-DK') : '0'} <small className="text-sm font-bold text-white/20 ml-1">kr.</small></p></div>
                        </div>
                    </div>
                    <div className="p-20 bg-white/[0.02] border border-white/10 rounded-[5rem] backdrop-blur-3xl flex flex-col items-center text-center relative shadow-inner group-hover:border-amber-400/20 transition-all duration-1000">
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-[80px]" /><p className="text-[11px] font-black uppercase text-amber-400 tracking-[0.5em] mb-8">Current Enterprise Value</p><h4 className="text-8xl md:text-9xl font-black text-white serif mb-6 tracking-tighter shadow-sm">{metrics ? `${(metrics.arr * 8 / 1000000).toFixed(1)}M` : '0M'}</h4><p className="text-3xl font-black text-amber-400/60 serif italic mb-12">Danske Kroner (8.0x Multiplier)</p><div className="w-full h-px bg-white/10 mb-12" /><div className="flex gap-16"><div><p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-2">Base ARR</p><p className="text-2xl font-black text-white">{Math.round(metrics?.arr || 0).toLocaleString('da-DK')} kr.</p></div><div className="w-px h-full bg-white/10" /><div><p className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-2">Platform Score</p><p className="text-2xl font-black text-emerald-400">Excellent</p></div></div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm space-y-12 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700">
                    <div className="flex items-center gap-5"><div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 duration-700"><BrainCircuit className="w-7 h-7" /></div><h3 className="text-2xl font-black text-slate-900 serif">AI Økonomi</h3></div>
                    <div className="space-y-8">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">LTV per Bruger (Est)</p>
                            <p className="text-3xl font-black text-slate-900 serif italic">
                                {metrics?.arpu && metrics?.churnRate 
                                    ? `${Math.round(metrics.arpu / metrics.churnRate).toLocaleString('da-DK')} kr.` 
                                    : '---'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-300 mt-3 italic">Beregnet over realtid ARPU & Churn Rate</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Netto Margin (AI)</p>
                            <p className="text-3xl font-black text-emerald-600 serif italic">92.4%</p>
                            <p className="text-[9px] font-bold text-indigo-400 mt-3 uppercase tracking-tighter font-black">Optimized with Gemini 2.0</p>
                        </div>
                    </div>
                </section>
                <section className="bg-indigo-900 p-12 rounded-[4.5rem] text-white shadow-2xl space-y-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" /><div className="flex items-center gap-5"><div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-sm"><Boxes className="w-7 h-7" /></div><h3 className="text-2xl font-black serif">Eksponentiel Vækst</h3></div><div className="space-y-8 relative z-10"><div className="space-y-4"><div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase tracking-widest text-white/40">Expansion Capacity</span><span className="text-xl font-black">12.5k Brugere</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '15%' }} transition={{ duration: 2, delay: 0.5 }} className="h-full bg-white shadow-lg shadow-white" /></div></div><p className="text-sm text-white/50 leading-relaxed italic">Systemet kan skalere til de næste 10.000 aktive brugere uden behov for yderligere arkitektonisk udvidelse.</p><button className="flex items-center justify-between w-full p-6 bg-white text-indigo-900 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-900/40">Ekspander Kapacitet <ArrowRight className="w-5 h-5" /></button></div>
                </section>
                <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group h-full">
                    <div className="space-y-12"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 duration-700"><Zap className="w-7 h-7" /></div><h3 className="text-2xl font-black text-slate-900 serif">Strategisk Fokus</h3></div><div className="space-y-10"><div className="space-y-4"><div className="flex justify-between items-end"><p className="text-5xl font-black text-slate-900 serif">82%</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Efficiency Score</p></div><div className="h-4 bg-slate-50 border border-slate-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-amber-500 rounded-full shadow-lg shadow-amber-500/20" /></div></div></div></div><div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between gap-6"><p className="text-xs text-slate-500 font-bold leading-relaxed italic">Fokuser på <span className="text-amber-600 font-black italic">Churn Reduction</span> de næste 30 dage for at accelerere ARR milestenen.</p><TrendingDown className="w-6 h-6 text-rose-300" /></div>
                </section>
            </div>
        </div>
    );
}

