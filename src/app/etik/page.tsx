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
    Lock
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

const EthicsCard = ({ icon: Icon, title, children, delay }: { icon: any, title: string, children: React.ReactNode, delay: number }) => (
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

export default function EthicsPage() {
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
                                <Scale className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Etik & Faglighed: <br /> <span className="text-amber-600 italic">Brug AI med Omtanke</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Som pædagog- eller socialrådgiverstuderende er din dømmekraft dit vigtigste redskab. Cohéro er designet til at skærpe den – ikke erstatte den.
                        </p>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid md:grid-cols-2 gap-8">
                    
                    <EthicsCard icon={BrainCircuit} title="AI er en Assistent, ikke et Facit" delay={0.2}>
                        <p>
                            Betragt Cohéros AI-værktøjer som en avanceret lommeregner for fagligt arbejde. Den kan udføre komplekse analyser og finde mønstre i lovtekster, men den kan ikke udøve et <span className="text-slate-900 font-bold">fagligt skøn</span>.
                        </p>
                        <p>
                            Et fagligt skøn kræver empati og situationsfornemmelse – alt det, der adskiller dig fra en algoritme. AI'ens output er derfor altid et forslag, aldrig et facit.
                        </p>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 mt-6">
                            <Quote className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-xs font-bold text-slate-500 italic uppercase tracking-wider leading-relaxed">
                                Brug AI-feedback til at opdage blinde pletter i din argumentation – men lad aldrig AI'en tænke for dig.
                            </p>
                        </div>
                    </EthicsCard>

                    <EthicsCard icon={UserCheck} title="Dit Personlige Ansvar" delay={0.3}>
                        <p>
                            Ethvert ord, du afleverer i en opgave, og enhver beslutning, du træffer i en case, er dit ansvar. Når du anvender output fra Cohéro, er det din opgave at validere, redigere og fagligt begrunde det.
                        </p>
                        <p>
                            Spørg altid dig selv: <span className="italic">"Hvordan ville jeg forsvare denne analyse over for en borger eller en vejleder med mine egne ord?"</span>
                        </p>
                    </EthicsCard>

                    <EthicsCard icon={Shield} title="Dataetik: Beskyt Borgeren" delay={0.4}>
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 mb-6">
                            <Lock className="w-5 h-5 text-rose-500" />
                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-relaxed">
                                DU MÅ ALDRIG INDTASTE PERSONFØLSOMME OPLYSNINGER OM VIRKELIGE PERSONER.
                            </p>
                        </div>
                        <p>
                            Alle cases, journalnotater og eksempler, du indtaster, skal være 100% anonymiserede og fiktionaliserede. At bruge AI til at behandle rigtige borgerdata er et alvorligt brud på din lovpligtige <span className="font-bold">tavshedspligt</span>.
                        </p>
                    </EthicsCard>

                    <EthicsCard icon={AlertCircle} title="AI løser ikke dilemmaer" delay={0.5}>
                        <p>
                            Etisk refleksion er kernen i dit fremtidige arbejde. Cohéro kan give dig information om lovgivning og teori, der kan <span className="font-bold">oplyse</span> dit dilemma, men den kan aldrig løse det for dig.
                        </p>
                        <p>
                            Brug platformen til at få overblik over de faglige rammer, og tag derefter den svære dialog med medstuderende eller din praktikvejleder.
                        </p>
                    </EthicsCard>
                </div>

                {/* PRINCIPLES SECTION */}
                <Reveal delay={0.6}>
                    <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] -z-1" />
                        
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <CheckSquare className="w-8 h-8 text-amber-400" />
                                <h2 className="text-3xl font-black uppercase tracking-widest text-[14px]">Principper for Ansvarlig AI</h2>
                            </div>
                            
                            <div className="grid gap-6">
                                {[
                                    "Brug AI som en sparringspartner – ikke som en erstatning for din hjerne.",
                                    "Validér altid alle kilder og lovhenvisninger, AI'en præsenterer.",
                                    "Hold alle cases 100% anonyme og fiktive.",
                                    "Vær kritisk over for eventuelle biases og systemfejl i AI-outputtet.",
                                    "Brug AI til at bygge selvtillid, ikke til at finde genveje."
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-lg font-medium text-slate-300">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-16 pt-12 border-t border-white/10 text-center">
                                <p className="text-slate-400 text-sm italic">
                                    "Den sande læring sker i det refleksive mellemrum – i din kritiske bearbejdning af det materiale, AI'en præsenterer."
                                </p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </main>

            {/* FOOTER BADGE */}
            <footer className="fixed bottom-0 left-0 right-0 p-8 z-[90] pointer-events-none flex justify-center">
                <div className="px-6 py-2 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="flex -space-x-1 items-end h-3">
                        <div className="w-0.5 h-full bg-amber-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-amber-500 rounded-full" />
                        <div className="w-0.5 h-full bg-amber-600 rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Etisk Faglighed</span>
                </div>
            </footer>
        </div>
    );
}
