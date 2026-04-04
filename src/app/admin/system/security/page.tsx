
'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Users, Globe, Smartphone, ArrowRight, Loader2, Mail, ExternalLink, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectAccountSharingAction, sendBulkEmailAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useApp } from '@/app/provider';

interface FlaggedUser {
    userId: string;
    userName: string;
    uniqueIps: number;
    uniqueDevices: number;
    riskLevel: 'critical' | 'high';
}

export default function SecurityFraudPage() {
    const { toast } = useToast();
    const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sendingOffer, setSendingOffer] = useState<string | null>(null);

    const fetchSecurityData = async () => {
        setIsRefreshing(true);
        try {
            const result = await detectAccountSharingAction();
            if (result.success && result.data) {
                setFlaggedUsers(result.data as FlaggedUser[]);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Security Scan Failed' });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const handleSendGroupOffer = async (user: FlaggedUser) => {
        setSendingOffer(user.userId);
        try {
            const subject = "Specielt tilbud til din studiegruppe fra Cohéro! 🎓";
            const body = `
                <h2 style="color: #0f172a; font-family: sans-serif;">Hej ${user.userName}!</h2>
                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                    Vi kan se, at din konto bliver brugt flittigt fra mange forskellige enheder. Det er fantastisk, at I er flere, der bruger Cohéro til at blive skarpere!
                </p>
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 24px 0;">
                    <p style="margin: 0; font-weight: bold; color: #4f46e5;">STUDIEGRUPPE RABAT</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px;">
                        I stedet for at dele ét login, kan I lige nu opgradere til vores <strong>Group Pro</strong> abonnement og få hver jeres profil til en brøkdel af prisen.
                    </p>
                </div>
                <p style="font-size: 16px; color: #334155;">
                    Brug koden <strong>GROUPUPGRADE</strong> og få 30% rabat på jeres første 3 måneder som gruppe.
                </p>
                <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
                    Bedste hilsner,<br>Cohéro Teamet
                </p>
            `;

            const result = await sendBulkEmailAction({
                recipients: [{ email: 'support@platform.cohero.dk', name: user.userName }], // In production, get real email
                subject,
                htmlBody: body
            });

            if (result.success) {
                toast({ title: 'Tilbud sendt!', description: `Vi har sendt et gruppe-tilbud til ${user.userName}.` });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Fejl ved afsendelse' });
        } finally {
            setSendingOffer(null);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20 pt-8 px-4">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100 shadow-sm shadow-rose-500/5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Security & Fraud Intelligence
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">AI Delings-Detektion</h1>
                    <p className="text-xl text-slate-500 font-medium italic">Monitorering af unormale login-mønstre og konvertering af konto-deling til gruppe-salg.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchSecurityData}
                        disabled={isRefreshing}
                        className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group active:scale-95 disabled:opacity-50"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRefreshing ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                            <History className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </div>
                    </button>
                    <div className="hidden sm:flex items-center gap-10 p-6 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Sky Scan Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-sm font-black text-white uppercase tracking-tighter">Monitoring Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SecurityStatCard title="Flaggede Konti" value={flaggedUsers.length} subtitle="Sidste 7 dage" color="bg-rose-50 text-rose-600" icon={ShieldAlert} />
                <SecurityStatCard title="Potentiel Omsætning" value={`${flaggedUsers.length * 3 * 89} kr.`} subtitle="Est. v. konvertering" color="bg-emerald-50 text-emerald-600" icon={Users} />
                <SecurityStatCard title="Sikkerheds-score" value="98.2%" subtitle="Aggregeret platform tillid" color="bg-blue-50 text-blue-600" icon={ShieldCheck} />
            </div>

            {/* Main Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-8">
                    <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><Users className="w-5 h-5" /></div>
                                <h3 className="text-2xl font-black text-slate-900 serif">Mistænkelig Aktivitet</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Baseret på metadata-analyse</span>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-32 flex flex-col items-center gap-6">
                                    <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Scanning audit logs...</p>
                                </div>
                            ) : flaggedUsers.length === 0 ? (
                                <div className="p-32 flex flex-col items-center gap-8">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-3xl font-black text-slate-800 serif italic">Ingen tegn på deling</h4>
                                        <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Alle aktive brugere holder sig indenfor normale rammer.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                            <th className="px-10 py-6">Bruger / ID</th>
                                            <th className="px-10 py-6">Anomali Status</th>
                                            <th className="px-10 py-6">Risk Level</th>
                                            <th className="px-10 py-6 text-right">Handling</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {flaggedUsers.map((u, idx) => (
                                            <tr key={u.userId} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-black text-slate-400">
                                                            {u.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-black text-slate-900 serif leading-none">{u.userName}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ID: {u.userId.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <Globe className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-bold">{u.uniqueIps} Unikke IP-adresser</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <Smartphone className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-bold">{u.uniqueDevices} Unikke Enheder</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${u.riskLevel === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${u.riskLevel === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                                        {u.riskLevel}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button 
                                                        onClick={() => handleSendGroupOffer(u)}
                                                        disabled={sendingOffer === u.userId}
                                                        className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-slate-800 disabled:opacity-50 flex items-center gap-3 ml-auto"
                                                    >
                                                        {sendingOffer === u.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                        Send Gruppe-Tilbud
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                <div className="xl:col-span-4 space-y-12">
                    <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black serif">AI Security Strategy</h3>
                                <p className="text-sm text-white/40 leading-relaxed italic">
                                    "I stedet for at straffe brugere for at dele deres logins, bør strategien være at konvertere dem til en **Group Pro** plan."
                                </p>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Registreret Anomali-Rate</p>
                                        <p className="text-3xl font-black text-rose-400 serif">14.2%</p>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '14.2%' }} transition={{ duration: 1.5 }} className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-white/5">
                                    <p className="text-[11px] font-bold text-white/60 leading-relaxed mb-8">
                                        Dine mest flittige overtrædere er ofte dine mest engagerede ambassadører. Ved at tilbyde en gruppe-rabat skaber du loyalty i stedet for irritation.
                                    </p>
                                    <Link href="/admin/marketing" className="flex items-center justify-between w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Se kampagne-settings</span>
                                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

const SecurityStatCard = ({ title, value, subtitle, color, icon: Icon }: any) => (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 group overflow-hidden relative">
        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color} shadow-lg shadow-current/10`}>
                <Icon className="w-8 h-8" />
            </div>
            <div className="text-right">
                <p className="text-4xl font-black text-slate-900 serif">{value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
        </div>
        <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] relative z-10">{title}</p>
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
    </div>
);
