'use client';

import React from 'react';
import { 
    Cookie, 
    Info, 
    Settings, 
    ShieldCheck, 
    Mail, 
    ArrowLeft,
    CheckCircle2,
    Lock,
    PieChart,
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

const PolicyCard = ({ icon: Icon, title, children, delay }: { icon: any, title: string, children: React.ReactNode, delay: number }) => (
    <Reveal delay={delay}>
        <div className="group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase tracking-widest text-[13px]">{title}</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
                {children}
            </div>
        </div>
    </Reveal>
);

export default function CookiePolicyPage() {
    return (
        <div className="bg-[#fafafa] min-h-screen selection:bg-amber-500/10 selection:text-amber-600">
            {/* HEADER */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-50/30 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <Reveal>
                        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all mb-8">
                            <ArrowLeft className="w-3 h-3" /> Tilbage til forsiden
                        </Link>
                    </Reveal>
                    
                    <Reveal delay={0.1}>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-amber-900 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-900/20">
                                <Cookie className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Cookiepolitik: <br /> <span className="text-amber-600 italic">Gennemsigtighed & Valg</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Vi bruger cookies til at forbedre din oplevelse på Cohéro. Her kan du læse om, hvordan vi bruger dem, og hvordan du selv har magten over dine data.
                        </p>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid md:grid-cols-2 gap-8">
                    
                    <PolicyCard icon={Info} title="1. Introduktion" delay={0.2}>
                        <p>
                            Denne cookiepolitik forklarer, hvordan Cohéro I/S ("vi", "os" eller "vores") bruger cookies og lignende teknologier på vores hjemmeside. Ved at bruge vores tjenester accepterer du brugen af cookies som beskrevet i denne politik.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={Layers} title="2. Hvad er cookies?" delay={0.3}>
                        <p>
                            Cookies er små tekstfiler, der gemmes på din computer eller mobile enhed, når du besøger en hjemmeside. De bruges til at huske dine præferencer, forbedre din brugeroplevelse og indsamle statistik.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={CheckCircle2} title="3. Strengt nødvendige cookies" delay={0.4}>
                        <p>
                            Disse er essentielle for, at du kan navigere på hjemmesiden og bruge dens funktioner, såsom at logge ind. Uden disse cookies kan de tjenester, du har anmodet om, ikke leveres korrekt eller sikkert.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={PieChart} title="4. Præstations- og analysecookies" delay={0.5}>
                        <p>
                            Disse cookies indsamler anonymiseret information om, hvordan besøgende bruger vores hjemmeside. Vi bruger denne data til at forstå, hvilke funktioner der er mest populære, og hvordan vi kan optimere platformen yderligere.
                        </p>
                    </PolicyCard>
                </div>

                {/* MANAGEMENT SECTION */}
                <Reveal delay={0.6}>
                    <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] -z-1" />
                        
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <Settings className="w-8 h-8 text-amber-400" />
                                <h2 className="text-3xl font-black uppercase tracking-widest text-[14px]">Administration af cookies</h2>
                            </div>
                            
                            <p className="text-lg text-slate-300 leading-relaxed mb-10">
                                Du kan til enhver tid ændre eller trække dit samtykke tilbage. De fleste browsere giver dig mulighed for at administrere dine cookie-indstillinger direkte i browserens indstillinger.
                            </p>

                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 text-center md:text-left">
                                    <h3 className="text-xl font-bold uppercase tracking-tight">Har du spørgsmål?</h3>
                                    <p className="text-slate-400 text-sm">Vi sidder klar til at hjælpe dig med dine data-spørgsmål.</p>
                                </div>
                                <a href="mailto:kontakt@cohero.dk" className="px-8 py-4 bg-amber-400 text-slate-950 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-900/40 flex items-center gap-3">
                                    <Mail className="w-4 h-4" /> Kontakt os
                                </a>
                            </div>
                        </div>
                    </div>
                </Reveal>

                <div className="mt-20 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Sidst opdateret: 26. marts 2026</p>
                </div>
            </main>

            {/* FOOTER BADGE */}
            <footer className="fixed bottom-0 left-0 right-0 p-8 z-[90] pointer-events-none flex justify-center">
                <div className="px-6 py-2 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="flex -space-x-1 items-end h-3">
                        <div className="w-0.5 h-full bg-amber-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-amber-500 rounded-full" />
                        <div className="w-0.5 h-full bg-amber-600 rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Cookie Politik</span>
                </div>
            </footer>
        </div>
    );
}
