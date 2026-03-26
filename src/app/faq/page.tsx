'use client';

import React, { useState } from 'react';
import { 
    HelpCircle, 
    Search, 
    ArrowLeft, 
    MessageCircle, 
    ShieldCheck, 
    CreditCard, 
    Users,
    ChevronDown,
    Plus,
    Minus,
    BookOpen,
    Scale,
    HandHelping,
    Sparkles,
    Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const FaqItem = ({ question, children, isOpen, onClick }: { question: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
    <div className={`group rounded-[2rem] border transition-all duration-500 overflow-hidden ${isOpen ? 'bg-white border-amber-200 shadow-2xl shadow-amber-950/5' : 'bg-white/50 border-slate-100 hover:border-amber-100 hover:bg-white'}`}>
        <button 
            onClick={onClick}
            className="w-full flex justify-between items-center p-8 text-left focus:outline-none"
        >
            <h3 className={`text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-amber-950' : 'text-slate-700'}`}>{question}</h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-amber-950 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600'}`}>
                <ChevronDown className="w-4 h-4" />
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="px-8 pb-8 prose prose-slate text-slate-500 leading-relaxed max-w-none">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            category: 'Generelt',
            icon: MessageCircle,
            questions: [
                {
                    q: "Hvad er Cohéro?",
                    a: "Cohéro er en AI-drevet digital læringsplatform for pædagog- og socialrådgiverstuderende i Danmark. Vores mission er at bygge bro mellem teori og praksis ved at tilbyde et trygt rum, hvor studerende kan træne faglige færdigheder i et sikkert miljø."
                },
                {
                    q: "Hvem står bag Cohéro?",
                    a: "Cohéro er grundlagt og drevet af socialrådgivere og pædagogiske udviklere med erfaring fra praksis. Vi er dine digitale kollegaer, der forstår de faglige udfordringer, du står overfor hver dag på studiet."
                }
            ]
        },
        {
            category: 'Værktøjer & Funktioner',
            icon: Sparkles,
            questions: [
                {
                    q: "Hvad er Online Kollega?",
                    a: "Online Kollega er din digitale AI-sparringspartner. Du kan chatte med den om alt fra lovgivning til etiske dilemmaer. Den er kodet til at fungere som en 'god kollega', der stiller spørgsmål og stimulerer din refleksion fremfor bare at give dig facit."
                },
                {
                    q: "Hvordan fungerer Lov-portalen?",
                    a: "Lov-portalen giver dig adgang til en intelligent søgning i paragraffer og lovgivning. Vores AI kan hjælpe dig med at forstå komplekse juridiske tekster og hvordan de anvendes i konkrete pædagogiske eller socialfaglige sammenhænge."
                },
                {
                    q: "Hvad er Cohéro Rådgivning?",
                    a: "Det er vores portal for borgere (Second Opinion). Som studerende kan du tage opgaver på markedspladsen, hvor du hjælper borgere med f.eks. at gennemgå deres sag eller skrive ansøgninger. Det giver dig autentisk træning og borgeren en uvurderlig hjælp."
                }
            ]
        },
        {
            category: 'Abonnementer',
            icon: CreditCard,
            questions: [
                {
                    q: "Er 'Kollega'-planen virkelig gratis?",
                    a: "Ja, 'Kollega'-planen er 100% gratis og uforpligtende. Den giver dig adgang til vores grundlæggende kerneværktøjer med visse begrænsninger, så du kan opleve værdien uden omkostninger."
                },
                {
                    q: "Hvordan opsiger jeg mit abonnement?",
                    a: "Du kan til enhver tid opsige dit abonnement under dine indstillinger. Opsigelsen træder i kraft ved udgangen af din nuværende betalingsperiode (månedsvis eller semestervis), og du beholder fuld adgang indtil da."
                }
            ]
        },
        {
            category: 'Datasikkerhed',
            icon: ShieldCheck,
            questions: [
                {
                    q: "Hvordan beskytter I mine data?",
                    a: "Vi tager sikkerhed meget alvorligt. Al kommunikation er krypteret, og vi gemmer aldrig personfølsomme oplysninger om tredjeparter. Det er dog dit eget ansvar altid at anonymisere dine cases før de tastes ind i AI-værktøjerne."
                }
            ]
        }
    ];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.flatMap(cat => cat.questions.map(q => ({
            "@type": "Question",
            "name": q.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.a
            }
        })))
    };

    const filteredFaqs = searchQuery 
        ? faqs.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q => 
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0)
        : faqs;

    return (
        <div className="bg-[#fafafa] min-h-screen selection:bg-amber-500/10 selection:text-amber-600">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* HEADER */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-50/30 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    <Reveal>
                        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all mb-8">
                            <ArrowLeft className="w-3 h-3" /> Tilbage til forsiden
                        </Link>
                    </Reveal>
                    
                    <Reveal delay={0.1}>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-amber-900 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-900/20">
                                <HelpCircle className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Ofte Stillede <br /> <span className="text-amber-600 italic">Spørgsmål</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Få svar på alt fra tekniske funktioner til abonnementer og filosofien bag Cohéro.
                        </p>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div className="max-w-lg mx-auto mt-12 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-rose-500/10 rounded-full blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
                            <div className="relative flex items-center bg-white border border-slate-100 rounded-full shadow-xl shadow-slate-200/50 p-1.5 pr-4 overflow-hidden focus-within:border-amber-200 transition-all">
                                <div className="pl-6 pr-3">
                                    <Search className="w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Søg i spørgsmål..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 py-4 bg-transparent focus:outline-none font-bold text-slate-900 placeholder:text-slate-300 text-base"
                                />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pb-40">
                <div className="space-y-20">
                    {filteredFaqs.map((category, catIndex) => (
                        <div key={catIndex} className="space-y-8">
                            <Reveal delay={0.1 * catIndex}>
                                <div className="flex items-center gap-4 px-4">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                        <category.icon className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{category.category}</h2>
                                    <div className="flex-1 h-px bg-slate-100" />
                                </div>
                            </Reveal>
                            
                            <div className="space-y-4">
                                {category.questions.map((faq, qIndex) => {
                                    const overallIndex = catIndex * 100 + qIndex;
                                    return (
                                        <Reveal key={qIndex} delay={0.1 * qIndex + 0.1 * catIndex}>
                                            <FaqItem 
                                                question={faq.q} 
                                                isOpen={openIndex === overallIndex}
                                                onClick={() => setOpenIndex(openIndex === overallIndex ? null : overallIndex)}
                                            >
                                                <p>{faq.a}</p>
                                            </FaqItem>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {filteredFaqs.length === 0 && (
                        <Reveal>
                            <div className="py-20 text-center text-slate-400 italic font-medium bg-white rounded-[3rem] border border-dashed border-slate-100">
                                Vi fandt desværre ingen svar der matchede din søgning.
                            </div>
                        </Reveal>
                    )}
                </div>

                {/* BOTTOM CTA */}
                <Reveal delay={0.5}>
                    <div className="mt-20 bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px]-z-1" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
                                <Mail className="w-8 h-8 text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-widest text-[14px]">Stadig i tvivl?</h2>
                            <p className="text-lg text-slate-400 leading-relaxed font-medium">
                                Vores team sidder klar til at hjælpe dig. Send os en mail, så vender vi tilbage hurtigst muligt.
                            </p>
                            <a href="mailto:kontakt@cohero.dk" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                Skriv til os
                            </a>
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
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Hjælpe Center</span>
                </div>
            </footer>
        </div>
    );
}
