'use client';

import React from 'react';
import { 
    Compass, 
    Sparkles, 
    GraduationCap, 
    Heart, 
    Users2, 
    ShieldCheck, 
    Mail, 
    ArrowLeft,
    CheckCircle2,
    BrainCircuit,
    Target,
    BookOpen,
    Quote,
    HandHelping,
    Scale
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

const ConceptCard = ({ icon: Icon, title, children, delay }: { icon: any, title: string, children: React.ReactNode, delay: number }) => (
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

export default function ConceptPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Hvorfor Cohéro? Kollegaskab frem for Tutoring",
        "description": "Cohéro bygger bro mellem teori og praksis. Vi er ikke en tutor, men en digital kollega, der giver dig et trygt rum til at træne, reflektere og vokse.",
        "url": "https://cohero.dk/hvorfor"
    };

    return (
        <div className="bg-[#fafafa] min-h-screen selection:bg-amber-500/10 selection:text-amber-600">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

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
                                <BrainCircuit className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Hvorfor Cohéro? <br /> <span className="text-amber-600 italic">Kollegaskab over Tutoring</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Vi giver dig ikke bare et svar. Vi giver dig et trygt rum til at træne, reflektere og vokse som professionel før du står overfor virkeligheden.
                        </p>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-40">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <ConceptCard icon={Compass} title="Udfordringen" delay={0.2}>
                        <p>
                            Kløften mellem tung teori og kompleks virkelighed kan føles overvældende. Mange mangler et sted at begå fejl uden konsekvenser.
                        </p>
                    </ConceptCard>

                    <ConceptCard icon={Users2} title="Vores Filosofi" delay={0.3}>
                        <p>
                            En god kollega respekterer din faglighed og stiller de rigtige spørgsmål – fremfor blot at servere et færdigt facit.
                        </p>
                    </ConceptCard>

                    <ConceptCard icon={Target} title="Målet" delay={0.4}>
                        <p>
                            Vi vil sikre, at du ikke bare består din eksamen, men føler dig klar til arbejdslivet fra din første dag i praktik eller job.
                        </p>
                    </ConceptCard>
                </div>

                {/* COMPARISON SECTION */}
                <Reveal delay={0.5}>
                    <div className="mt-20 grid md:grid-cols-2 gap-8 items-stretch">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Den Traditionelle Vej</h3>
                            <h4 className="text-2xl font-bold mb-6 text-slate-900 italic">"Tutoring"</h4>
                            <ul className="space-y-4 text-slate-500">
                                <li className="flex items-center gap-3 line-through opacity-50"><XCircle className="w-4 h-4 text-rose-300" /> Leverer facitlister</li>
                                <li className="flex items-center gap-3 line-through opacity-50"><XCircle className="w-4 h-4 text-rose-300" /> Passiv læring</li>
                                <li className="flex items-center gap-3 line-through opacity-50"><XCircle className="w-4 h-4 text-rose-300" /> Afkoblet fra praksis</li>
                                <li className="flex items-center gap-3 line-through opacity-50"><XCircle className="w-4 h-4 text-rose-300" /> Fokus på karakterer</li>
                            </ul>
                        </div>
                        <div className="bg-amber-900 p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[80px]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500/50 mb-8">Cohéro Vejen</h3>
                            <h4 className="text-2xl font-bold mb-6 italic">"Kollegaskab"</h4>
                            <ul className="space-y-4 text-amber-50/70">
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Stimulerer refleksion</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Aktiv træning</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Virkelighedstro cases</li>
                                <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Fokus på faglig selvtillid</li>
                            </ul>
                        </div>
                    </div>
                </Reveal>

                {/* RAADGIVNING PHILOSOPHY */}
                <Reveal delay={0.6}>
                    <div className="mt-20 bg-rose-50 rounded-[4rem] p-12 md:p-20 border border-rose-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] -z-1" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row gap-16 items-center">
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-950/20">
                                    <HandHelping className="w-8 h-8" />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 serif leading-tight">
                                    Cohéro Rådgivning: <br /> <span className="text-rose-600 italic">Broen til det virkelige liv</span>
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                    Vores filosofi rækker ud over skærmen. Gennem vores rådgivningsportal skaber vi en unik synergi, hvor borgere får uvurderlig hjælp, og du som studerende får den mest autentiske træning muligt.
                                </p>
                            </div>
                            
                            <div className="flex-1 grid gap-4 w-full">
                                <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-rose-500" /> Anden udtalelse (Second Opinion)
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Vi giver studerende mulighed for at assistere borgere med ansøgninger og sagsgennemgang. Det er her, teorien for alvor bliver virkelighed.
                                    </p>
                                </div>
                                <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-rose-500" /> Gensidig vækst
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Borgeren får en økonomisk overkommelig hjælp, mens du opbygger en portefølje af rigtige sager under trygge rammer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* VALUES SECTION */}
                <Reveal delay={0.7}>
                    <div className="mt-20 bg-white rounded-[4rem] p-12 md:p-20 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50 blur-[100px] -z-1" />
                        
                        <div className="relative z-10 grid md:grid-cols-2 gap-20 items-center">
                            <div className="space-y-8">
                                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <h2 className="text-4xl font-extrabold text-slate-900 serif leading-tight">
                                    Vi er din faglige rygdækning gennem hele studiet
                                </h2>
                                <p className="text-lg text-slate-500 leading-relaxed italic">
                                    "Den sande læring sker ikke i bøgerne alene – den sker dér, hvor teorien møder det menneskelige skøn."
                                </p>
                            </div>
                            
                            <div className="grid gap-6">
                                {[
                                    { icon: GraduationCap, text: "Klar til arbejdslivet fra dag ét" },
                                    { icon: ShieldCheck, text: "Trygt rum til at fejle og lære" },
                                    { icon: Sparkles, text: "Inspiration fremfor begrænsning" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-colors group">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-600 group-hover:scale-110 transition-transform">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Reveal>

                <div className="mt-20 text-center">
                    <Reveal delay={0.7}>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Lyst til at vide mere?</p>
                        <a href="mailto:kontakt@cohero.dk" className="inline-flex items-center gap-3 px-10 py-5 bg-slate-950 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                            <Mail className="w-4 h-4" /> Kontakt os
                        </a>
                    </Reveal>
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
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Vores Koncept</span>
                </div>
            </footer>
        </div>
    );
}

const XCircle = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
);
