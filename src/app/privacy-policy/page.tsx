'use client';

import React from 'react';
import { 
    ShieldCheck, 
    Database, 
    Target, 
    Share2, 
    UserCircle, 
    History, 
    Mail, 
    ArrowLeft,
    Lock,
    Eye,
    BrainCircuit,
    Users,
    CheckCircle2,
    FileSearch,
    Star
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
        <div className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1 transition-all">
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

export default function PrivacyPolicyPage() {
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
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Privatliv: <br /> <span className="text-amber-600 italic">Gennemsigtighed & Tillid</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Cohéro er bygget med ét formål: At hjælpe pædagog- og socialrådgiverstuderende. Her gælder dine faglige rettigheder også for dine data.
                        </p>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <PolicyCard icon={Lock} title="1. Dataansvarlig" delay={0.2}>
                        <p>
                            Cohéro I/S (CVR: 46181425) er dataansvarlig. Vi beskytter dine data i overensstemmelse med GDPR og dansk lovgivning.
                        </p>
                        <p className="text-sm border-t border-slate-100 pt-4">
                            Kontakt os på: <br />
                            <span className="font-bold text-slate-900">kontakt@cohero.dk</span>
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={BrainCircuit} title="2. AI & Data-anonymitet" delay={0.3}>
                        <p>
                            Når du bruger vores AI-værktøjer (f.eks. Kollega eller Lov-portal), behandles dine input af AI-udbydere (som OpenAI/Google/Anthropic).
                        </p>
                        <p className="font-bold text-rose-600 text-sm italic">
                            Alt input skal være anonymiseret. Vi træner ikke AI-modeller på dine personlige cases.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={Star} title="3. Praktikvurderinger" delay={0.4}>
                        <p>
                            Når du volder en institution, vælger du selv om dit navn skal være synligt (offentligt) eller om anmeldelsen skal være anonym.
                        </p>
                        <p>
                            Anonyme anmeldelser gemmes uden reference til din identitet på den offentlige portal.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={FileSearch} title="4. Seminarer & Filer" delay={0.5}>
                        <p>
                            Når du uploader præsentationer eller PDF'er til seminar-chatten, gemmes disse sikkert. De bruges kun til at give dig kontekst-baseret AI-hjælp.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={Users} title="5. Fællesskab & Synlighed" delay={0.6}>
                        <p>
                            Dit valgte <span className="font-bold">brugernavn</span> og dine optjente point er synlige på Leaderboardet og i aktivitetsfeedet for at fremme motivation.
                        </p>
                        <p>
                            Din email og dit fulde navn deles aldrig med andre brugere.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={Share2} title="6. Tredjeparter" delay={0.7}>
                        <p>
                            Vi benytter Firebase (hosting/database), Stripe (betaling) og AI-modeller. Alle partnere er nøje udvalgt ud fra deres sikkerhed og overholdelse af databeskyttelse.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={UserCircle} title="7. Dine Rettigheder" delay={0.8}>
                        <p>
                            Du har ret til at få udleveret dine data, få dem rettet eller få slettet din konto permanent. Dette kan gøres direkte i dine indstillinger eller ved at kontakte os.
                        </p>
                    </PolicyCard>

                    <PolicyCard icon={History} title="8. Datalagring" delay={0.9}>
                        <p>
                            Vi opbevarer dine data, så længe du er aktiv på platformen. Inaktive konti og deres tilhørende data slettes efter 24 måneder.
                        </p>
                    </PolicyCard>
                </div>

                {/* PRIVACY PROMISE */}
                <Reveal delay={1.0}>
                    <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] -z-1" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto text-center">
                            <div className="flex justify-center mb-8">
                                <Eye className="w-12 h-12 text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-widest text-[14px] mb-8 text-center leading-relaxed">Etisk databehandling er en del af din faglighed</h2>
                            
                            <div className="grid md:grid-cols-2 gap-8 mb-12">
                                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                    <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Intet salg af data
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Vi tjener penge på abonnementer – aldrig på at sælge dine oplysninger til tredjeparter.
                                    </p>
                                </div>
                                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
                                    <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Fuld kontrol
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Du kan til enhver tid trække dit samtykke tilbage og slette din historik.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <a href="mailto:kontakt@cohero.dk" className="inline-flex items-center gap-3 px-10 py-5 bg-amber-400 text-slate-950 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-amber-900/40">
                                    <Mail className="w-4 h-4" /> Kontakt os angående data
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
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Privatlivs Politik</span>
                </div>
            </footer>
        </div>
    );
}
