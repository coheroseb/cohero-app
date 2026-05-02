'use client';

import React from 'react';
import { 
    Scale, 
    BrainCircuit, 
    Shield, 
    UserCheck, 
    CheckSquare, 
    AlertCircle, 
    ArrowLeft,
    Zap,
    Quote,
    CheckCircle2,
    Lock,
    Sparkles,
    Eye,
    HandMetal
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

const Reveal = ({ children, delay = 0, y = 20 }: { children: React.ReactNode, delay?: number, y?: number }) => (
    <motion.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

const EthicsCard = ({ icon: Icon, title, children, delay, gradient }: { icon: any, title: string, children: React.ReactNode, delay: number, gradient: string }) => (
    <Reveal delay={delay} y={40}>
        <div className="group relative bg-white/[0.03] backdrop-blur-3xl p-10 md:p-12 rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-700">
            {/* Animated Gradient Background */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 ${gradient}`} />
            
            <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                    <Icon className="w-8 h-8" />
                </div>
                <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6">{title}</h2>
                <div className="space-y-6 text-slate-400 leading-relaxed font-medium text-lg">
                    {children}
                </div>
            </div>
        </div>
    </Reveal>
);

export default function EthicsPage() {
    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-500/10 selection:text-amber-600 overflow-hidden font-sans">
            
            {/* AMBIENT BACKGROUND */}
            <motion.div 
                style={{ y: backgroundY }}
                className="fixed inset-0 pointer-events-none z-0"
            >
                <div className="absolute top-0 left-[-10%] w-[60%] h-[60%] bg-amber-100/30 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-rose-50/40 blur-[150px] rounded-full" />
                <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-indigo-50/30 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </motion.div>

            {/* NAV BAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto">
                    <Link href="/" className="group flex items-center gap-4 px-6 py-3 bg-white border border-slate-100 shadow-sm rounded-full hover:bg-slate-50 transition-all">
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Retur</span>
                    </Link>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Kollega+ Standard</span>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="relative pt-48 pb-32 px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <div className="flex flex-col items-center text-center">
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/10 mb-12"
                            >
                                <Scale className="w-12 h-12 text-white" />
                            </motion.div>
                            
                            <h1 className="text-6xl md:text-9xl font-black text-slate-950 tracking-tighter leading-[0.9] mb-12 italic">
                                ETISK <br /> 
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 animate-gradient-x">FAGLIGHED</span>
                            </h1>
                            
                            <p className="max-w-3xl text-xl md:text-2xl text-slate-500 font-medium leading-relaxed mb-16">
                                Som fremtidens velfærdsarbejder er din menneskelige dømmekraft din stærkeste valuta. <br className="hidden md:block" />
                                Cohéro er her for at <span className="text-slate-950 italic">forstærke</span> den – aldrig erstatte den.
                            </p>

                            <div className="flex items-center gap-12 text-slate-300">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Status</span>
                                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Aktiv Protokol
                                    </span>
                                </div>
                                <div className="w-px h-10 bg-slate-200" />
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Version</span>
                                    <span className="text-xs font-bold text-slate-900">4.0.2 High-Fidelity</span>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-6 pb-60 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-32">
                    
                    <EthicsCard 
                        icon={BrainCircuit} 
                        title="Assistent, ikke Facit" 
                        delay={0.2}
                        gradient="bg-indigo-500"
                    >
                        <p>
                            Betragt Cohéros AI som en <span className="text-slate-900 font-bold underline decoration-amber-500/50 underline-offset-4">kognitiv lommeregner</span>. Den findes for at håndtere den tunge data-analyse, så du kan fokusere på det menneskelige.
                        </p>
                        <p>
                            AI kan finde paragraffer og mønstre, men den ejer ikke <span className="text-slate-900 italic">situationsfornemmelse</span>. Dit faglige skøn er det eneste, der kan navigere i komplekse menneskelige relationer.
                        </p>
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex gap-6 mt-8 shadow-inner">
                            <Quote className="w-6 h-6 text-amber-500 shrink-0" />
                            <p className="text-sm font-bold text-slate-600 italic uppercase tracking-wider leading-relaxed">
                                Lad AI oplyse dine blinde vinkler, men lad den aldrig træffe valgene for dig.
                            </p>
                        </div>
                    </EthicsCard>

                    <EthicsCard 
                        icon={UserCheck} 
                        title="Det Radikale Ansvar" 
                        delay={0.3}
                        gradient="bg-rose-500"
                    >
                        <p>
                            Når du sender en opgave eller træffer en beslutning, er der kun ét navn på dokumentet: <span className="text-slate-950 font-black tracking-wider uppercase">DIT</span>.
                        </p>
                        <p>
                            Hver eneste konklusion Cohéro genererer skal passere gennem dit kritiske filter. Hvis du ikke kan forsvare en analyse med din egen faglige stemme, skal den ikke bruges.
                        </p>
                        <div className="pt-6 flex items-center gap-4 border-t border-slate-100 mt-8">
                            <HandMetal className="w-5 h-5 text-amber-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejerskab er fundamentet</span>
                        </div>
                    </EthicsCard>

                    <EthicsCard 
                        icon={Shield} 
                        title="Hellig Tavshedspligt" 
                        delay={0.4}
                        gradient="bg-emerald-500"
                    >
                        <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-5 mb-8">
                            <Lock className="w-6 h-6 text-rose-500 animate-pulse" />
                            <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest leading-tight">
                                ABSOLUT FORBUD MOD PERSONFØLSOM DATA.
                            </p>
                        </div>
                        <p>
                            At beskytte borgerens privatliv er ikke bare en regel – det er en <span className="text-slate-900 font-bold">hellig ed</span>. Alt indhold i Cohéro skal være 100% fiktionaliseret.
                        </p>
                        <p>
                            Brug aldrig rigtige navne, adresser eller personnumre. AI-behandling af persondata uden samtykke er et direkte brud på din tavshedspligt og GDPR.
                        </p>
                    </EthicsCard>

                    <EthicsCard 
                        icon={AlertCircle} 
                        title="Etikkens Grænseland" 
                        delay={0.5}
                        gradient="bg-amber-500"
                    >
                        <p>
                            Etik handler ikke om at følge regler, men om at navigere i <span className="text-slate-950 italic">dilemmaer</span>. AI har ingen samvittighed og føler ikke vægten af et svært valg.
                        </p>
                        <p>
                            Brug platformen til at belyse dilemmaet fra teoretiske og juridiske vinkler, men husk: Den svære beslutning skal altid tages sammen med dine levende kollegaer.
                        </p>
                        <div className="flex gap-2 mt-8">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                            ))}
                        </div>
                    </EthicsCard>
                </div>

                {/* MANIFESTO SECTION */}
                <Reveal delay={0.6} y={60}>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />
                        <div className="relative bg-white/40 backdrop-blur-3xl rounded-[4rem] p-16 md:p-24 border border-white shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 text-slate-100 rotate-12">
                                <Scale className="w-64 h-64" />
                            </div>
                            
                            <div className="max-w-3xl relative z-10">
                                <div className="flex items-center gap-5 mb-12">
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/20">
                                        <CheckSquare className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">VORES MANIFEST</h2>
                                </div>
                                
                                <div className="space-y-8">
                                    {[
                                        "Sparring før Kopiering: Brug AI til refleksion, aldrig reproduktion.",
                                        "Kildekritik er Konge: Validér hver eneste henvisning manuelt.",
                                        "Beskyttelse frem for alt: Anonymitet er ikke til diskussion.",
                                        "Kritisk Blik: Udfordr AI-modellens biases og 'hallucinationer'.",
                                        "Vækst gennem Indsigt: Brug værktøjet til at blive klogere, ikke hurtigere."
                                    ].map((step, i) => (
                                        <motion.div 
                                            key={i} 
                                            whileHover={{ x: 20 }}
                                            className="flex items-start gap-6 p-8 bg-white/50 border border-white rounded-3xl hover:bg-white transition-all cursor-default shadow-sm"
                                        >
                                            <div className="mt-1">
                                                <div className="w-6 h-6 rounded-full border-2 border-amber-500 flex items-center justify-center">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                                </div>
                                            </div>
                                            <p className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">{step}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-20 pt-16 border-t border-slate-100">
                                    <p className="text-2xl md:text-3xl text-slate-500 font-medium italic leading-relaxed">
                                        "Den sande læring opstår i det <span className="text-slate-950">kritiske mellemrum</span> mellem AI'ens forslag og din bearbejdning."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </main>

            {/* FLOATING ACTION BUTTON */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]">
                <Link href="/portal" className="group flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <span>Gå til portalen</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* SIDE NAVIGATION DECORATION */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-50">
                {[Eye, Zap, Shield, HandMetal].map((Icon, i) => (
                    <div key={i} className="w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-center text-slate-300 hover:text-amber-500 transition-colors cursor-help">
                        <Icon className="w-5 h-5" />
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 10s ease infinite;
                }
            `}</style>
        </div>
    );
}
