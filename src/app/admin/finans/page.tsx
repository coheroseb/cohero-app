
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
  ComposedChart,
  ReferenceDot
} from 'recharts';
import { jsPDF } from 'jspdf';
import { getStripeDashboardMetricsAction, getStripeHistoricalRevenueAction, syncAllSubscriptionsAction, getSystemLogsAction } from '@/app/actions';
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
            <div 
                className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-5">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColors}`}>
                        {log.status === 'completed_with_errors' ? 'Færdig med fejl' : log.status === 'completed' ? 'Færdig' : 'Kører...'}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">
                            {new Date(log.startTime).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daglig Betalingssync</p>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Processed</p>
                        <p className="text-sm font-black text-slate-900">{log.processedCount || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Downgrades</p>
                        <p className="text-sm font-black text-rose-600">{log.downgradeCount || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Errors</p>
                        <p className="text-sm font-black text-slate-900">{log.errorCount || 0}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && log.details && log.details.length > 0 && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 bg-slate-50/50 p-6"
                    >
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                            {log.details.map((detail: string, i: number) => (
                                <div key={i} className={`p-3 rounded-xl border text-[11px] font-medium font-mono ${detail.startsWith('ERROR') ? 'bg-rose-50 border-rose-100 text-rose-700' : detail.startsWith('DOWNGRADE') ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-white border-slate-100 text-slate-600'}`}>
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
            <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-2xl space-y-4 min-w-[200px]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-3 mb-3">{label}</p>
                <div className="space-y-3">
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${p.name === 'revenue' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{p.name === 'revenue' ? 'Historisk' : 'Prognose'}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{Math.round(p.value).toLocaleString('da-DK')} kr.</span>
                        </div>
                    ))}
                </div>
                {payload[0]?.payload?.isExamMonth && (
                    <div className="mt-4 pt-3 border-t border-amber-50 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Eksamens-Boost Aktiv</span>
                    </div>
                )}
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
    const [isSyncing, setIsSyncing] = useState(false);
    const [growthRate, setGrowthRate] = useState(15); 
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

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

        async function fetchLogs() {
            setIsLogsLoading(true);
            try {
                const res = await getSystemLogsAction('payment_sync', 10);
                if (res.success && res.data) setSyncLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch sync logs:", err);
            } finally {
                setIsLogsLoading(false);
            }
        }

        fetchData();
        fetchLogs();
    }, []);

    // Advanced Projections Logic with Seasonality (Exam Periods)
    const projections = useMemo(() => {
        if (!metrics || !history.length) return [];
        const baseMRR = metrics.mrr;
        const result = [...history.slice(-4)].map(h => ({ ...h, isExamMonth: false })); 
        
        let currentMRR = baseMRR;
        const examMonths = [0, 5]; // Jan (0), Jun (5)

        for (let i = 1; i <= 12; i++) {
            const date = new Date(); 
            date.setMonth(date.getMonth() + i);
            const isExamMonth = examMonths.includes(date.getMonth());
            
            // Apply a seasonal boost if it's an exam month
            // We assume growth is 60% higher during these months due to high platform relevance
            const monthlyGrowth = (growthRate / 100 / 12);
            const boost = isExamMonth ? 1.6 : 1.0;
            
            currentMRR = currentMRR * (1 + (monthlyGrowth * boost));
            
            result.push({ 
                name: date.toLocaleString('da-DK', { month: 'short', year: '2-digit' }).toUpperCase(), 
                revenue: null, 
                projected: currentMRR,
                isExamMonth
            });
        }
        return result;
    }, [metrics, history, growthRate]);

    const examPeriodImpact = useMemo(() => {
        const exams = projections.filter(p => p.isExamMonth && p.projected);
        if (exams.length === 0) return null;

        const nextExam = exams[0];
        const prevMonth = projections[projections.indexOf(nextExam) - 1];
        const growth = prevMonth?.projected ? ((nextExam.projected - prevMonth.projected) / prevMonth.projected) * 100 : 0;
        
        return {
            name: nextExam.name,
            projectedMrr: nextExam.projected,
            growth: growth,
            delta: nextExam.projected - (prevMonth?.projected || 0)
        };
    }, [projections]);

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
        } finally {
            setIsExporting(null);
        }
    };

    const handleSyncSubscriptions = async () => {
        if (!window.confirm('Vil du synkronisere alle abonnementsstatusser med Stripe? Dette vil gennemgå alle brugere og sikre, at deres adgang matcher deres Stripe-betaling.')) return;
        
        setIsSyncing(true);
        try {
            const res = await syncAllSubscriptionsAction();
            if (res.success) {
                // Successful sync notification
                const mRes = await getStripeDashboardMetricsAction();
                if (mRes.success) setMetrics(mRes);
                
                // Refresh logs to show the new run
                const lRes = await getSystemLogsAction('payment_sync', 10);
                if (lRes.success && lRes.data) setSyncLogs(lRes.data);
                
                alert(res.message);
            } else {
                alert('Synkronisering fejlede: ' + res.message);
            }
        } catch (err: any) {
            console.error("Sync error:", err);
            alert('Der skete en fejl under synkronisering.');
        } finally {
            setIsSyncing(false);
        }
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
                        onClick={handleSyncSubscriptions}
                        disabled={isSyncing || loading}
                        className="flex items-center gap-6 p-6 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all">
                            {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase text-emerald-600/50 tracking-widest leading-none mb-1.5">System Audit</p>
                            <p className="text-sm font-black text-emerald-900 leading-none">Sync Betalinger</p>
                        </div>
                    </button>

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

            {/* 3. Global Growth Visualization */}
            <div className="w-full">
                <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 serif">Strategisk Vækst-Prognose</h2>
                            <p className="text-sm text-slate-400 font-medium mt-2">Visualisering af Cohero's MRR-momentum inklusive intelligente sæson-korrektioner for de danske eksamensperioder.</p>
                        </div>
                        <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Simuler Vækst:</span>
                            <div className="flex gap-1">
                                {[5, 10, 20, 40].map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => setGrowthRate(r)} 
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${growthRate === r ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {r}% 
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-[500px] w-full relative">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-[2.5rem]">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Henter Finansiel Data...</p>
                                </div>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height={500}>
                            <ComposedChart data={projections} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                                />
                                <Tooltip 
                                    content={<CustomTooltip />} 
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                />
                                
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorRev)" 
                                    name="revenue"
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="projected" 
                                    stroke="#10b981" 
                                    strokeWidth={3} 
                                    strokeDasharray="8 8"
                                    fillOpacity={1} 
                                    fill="url(#colorProj)" 
                                    name="projected"
                                />
                                
                                {projections.map((entry, index) => entry.isExamMonth ? (
                                    <ReferenceDot 
                                        key={index} 
                                        x={entry.name} 
                                        y={entry.projected || entry.revenue} 
                                        r={6} 
                                        fill="#fbbf24" 
                                        stroke="#fff" 
                                        strokeWidth={3} 
                                    />
                                ) : null)}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mt-16 pt-10 border-t border-slate-50">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Årlig Target (12M)</p>
                            <p className="text-3xl font-black text-slate-900 serif">
                                {Math.round((projections[projections.length - 1]?.projected || 0) * 12).toLocaleString('da-DK')} 
                                <small className="text-sm font-medium text-slate-300 ml-2">kr.</small>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Næste Sæson Boost</p>
                            <p className="text-3xl font-black text-slate-900 serif">
                                +{Math.round(examPeriodImpact?.growth || 0)}% 
                                <small className="text-sm font-medium text-amber-300 ml-2">impact</small>
                            </p>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-10">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Historisk MRR</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Vækst Prognose</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/20" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Eksamen</span>
                            </div>
                        </div>
                    </div>
                </section>
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

            {/* 5. Payment Sync History */}
            <section className="space-y-10 pt-10 border-t border-slate-50">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 serif">Historik over Betalingssync</h3>
                            <p className="text-sm text-slate-400 font-medium italic">Oversigt over automatiske og manuelle system-synkroniseringer.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {isLogsLoading && syncLogs.length === 0 ? (
                        <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Henter log-historik...</p>
                        </div>
                    ) : syncLogs.length === 0 ? (
                        <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <Activity className="w-10 h-10" />
                            </div>
                            <p className="text-xl font-bold text-slate-400 serif">Ingen log-historik fundet</p>
                            <p className="text-sm text-slate-300 max-w-sm">Systemet har endnu ikke logget nogen automatiske synkroniseringer.</p>
                        </div>
                    ) : (
                        syncLogs.map((log) => (
                            <PaymentSyncLog key={log.id} log={log} />
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

