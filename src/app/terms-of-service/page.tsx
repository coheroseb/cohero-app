'use client';

import React from 'react';
import { 
    Gavel, 
    Zap, 
    CreditCard, 
    XCircle, 
    ShieldAlert, 
    RefreshCw, 
    Mail, 
    ArrowLeft,
    CheckCircle2,
    Lock,
    Scale,
    ShieldCheck
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

const TermsCard = ({ icon: Icon, title, children, delay }: { icon: any, title: string, children: React.ReactNode, delay: number }) => (
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

export default function TermsOfServicePage() {
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
                                <Gavel className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Handelsbetingelser: <br /> <span className="text-amber-600 italic">Tryghed & Gennemsigtighed</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Her finder du de juridiske rammer for din brug af Cohéro. Vi har gjort dem så klare og ligefremme som muligt.
                        </p>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid md:grid-cols-2 gap-8">
                    
                    <TermsCard icon={Zap} title="1. Generelt & Brugsret" delay={0.2}>
                        <p>
                            Cohéro I/S (CVR: 46181425) udbyder en digital læringsplatform. Ved at oprette en konto accepterer du disse betingelser. Din adgang er personlig og må ikke deles.
                        </p>
                        <p>
                            Vi lægger stor vægt på det faglige fællesskab, og derfor kan dit valgte brugernavn blive vist i sociale funktioner som Leaderboards.
                        </p>
                    </TermsCard>

                    <TermsCard icon={CreditCard} title="2. Priser & Betaling" delay={0.3}>
                        <p>
                            Alle priser er i DKK inkl. moms. Vi anvender Stripe til sikker betalingshåndtering, og vi opbevarer aldrig dine kortoplysninger selv.
                        </p>
                        <p>
                            Abonnementer fornyes automatisk ved udgangen af hver periode, indtil de opsiges.
                        </p>
                    </TermsCard>

                    <TermsCard icon={XCircle} title="3. Opsigelse & Fortrydelse" delay={0.4}>
                        <p>
                            Du kan til enhver tid opsige dit abonnement via din profilside. Opsigelsen træder i kraft ved udgangen af den betalte periode.
                        </p>
                        <p>
                            Da adgangen leveres øjeblikkeligt digitalt, frafalder den 14-dages fortrydelsesret, så snart tjenesten tages i brug.
                        </p>
                    </TermsCard>

                    <TermsCard icon={ShieldAlert} title="4. Forbud mod personfølsom data" delay={0.5}>
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 mb-6">
                            <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-relaxed">
                                DET ER STRENGT FORBUDT AT INDTASTE RIGTIGE BORGERSAGER.
                            </p>
                        </div>
                        <p>
                            Alt data skal være 100% anonymiseret og fiktivt. Overtrædelse medfører øjeblikkelig spærring af kontoen uden refusion.
                        </p>
                    </TermsCard>

                    <TermsCard icon={Scale} title="5. Ansvarsfraskrivelse" delay={0.6}>
                        <p>
                            Alle svar fra vores AI-værktøjer er <span className="font-bold">vejledende og til inspiration</span>. De udgør ikke juridisk rådgivning eller professionel supervision.
                        </p>
                        <p>
                            Det faglige og etiske ansvar for dine handlinger og beslutninger påhviler altid dig selv som studerende/fagperson.
                        </p>
                    </TermsCard>

                    <TermsCard icon={RefreshCw} title="6. Ændringer" delay={0.7}>
                        <p>
                            Vi forbeholder os retten til løbende at opdatere disse betingelser for at sikre den bedste oplevelse. Væsentlige ændringer varsles direkte til din mail.
                        </p>
                    </TermsCard>
                </div>

                {/* CONTACT SECTION */}
                <Reveal delay={0.8}>
                    <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] -z-1" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto text-center">
                            <div className="flex justify-center mb-8">
                                <ShieldCheck className="w-12 h-12 text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-widest text-[14px] mb-6">Gennemsigtig handel</h2>
                            <p className="text-lg text-slate-300 leading-relaxed mb-10">
                                Har du spørgsmål til vores betingelser, dit abonnement eller betaling? Vi er her for at hjælpe dig.
                            </p>
                            <a href="mailto:kontakt@cohero.dk" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                <Mail className="w-4 h-4" /> Kontakt support
                            </a>
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
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Handelsbetingelser</span>
                </div>
            </footer>
        </div>
    );
}
