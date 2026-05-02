'use client';

import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Sparkles, 
    ShieldCheck, 
    Clock, 
    Send, 
    BookOpen, 
    Target, 
    Zap, 
    Scale,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    ChevronRight,
    ArrowLeft,
    Terminal,
    BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/app/provider';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { generateJournalScenarioAction, evaluateJournalEntryAction } from '@/app/actions';

// Mock Scenarios for now - will be moved to AI generation later
const INITIAL_SCENARIOS = [
    {
        id: '1',
        title: 'Børnesamtale: Mistanke om omsorgssvigt',
        category: 'Børn & Unge',
        difficulty: 'Middel',
        context: 'Du har netop afholdt en samtale med 8-årige Lucas. Han nævner perifert, at "far nogle gange glemmer at købe mad, når han er træt". Du bemærker, at Lucas har beskidt tøj på og virker undvigende.',
        objective: 'Skriv et objektivt journalnotat, der dokumenterer dine observationer og citater fra barnet, uden at drage forhastede konklusioner, men med blik for bekymringspunkter jf. Barnets Lov.',
        legalReference: 'Barnets Lov § 19 (Observationer)'
    },
    {
        id: '2',
        title: 'Voksenstøtte: Afslag på BPA-ordning',
        category: 'Voksne & Handicap',
        difficulty: 'Høj',
        context: 'Borgeren (Erik, 45 år) er stærkt utilfreds med afgørelsen. Han råber og truer med at klage til Ombudsmanden. Du skal dokumentere partshøringen og hans reaktion.',
        objective: 'Dokumentér forløbet med fokus på Erik\'s udtalelser, din egen faglige vejledning og overholdelse af forvaltningslovens rammer for god forvaltningsskik.',
        legalReference: 'Forvaltningsloven § 21 (Aktindsigt og notatpligt)'
    }
];

export default function JournalTrainerPage() {
    const { user, userProfile } = useApp();
    const { toast } = useToast();
    const [step, setStep] = useState<'selection' | 'writing' | 'feedback'>('selection');
    const [selectedScenario, setSelectedScenario] = useState<any>(null);
    const [journalContent, setJournalContent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<any>(null);

    const handleStartScenario = (scenario: any) => {
        setSelectedScenario(scenario);
        setStep('writing');
    };

    const handleGenerateNewScenario = async (topic?: string) => {
        setIsAnalyzing(true);
        try {
            const res = await generateJournalScenarioAction({ 
                topic, 
                profession: userProfile?.profession 
            });
            if (res.data) {
                setSelectedScenario(res.data);
                setStep('writing');
            }
        } catch (err) {
            toast({ title: "Fejl", description: "Kunne ikke generere scenarie.", variant: "destructive" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmitForFeedback = async () => {
        if (journalContent.length < 50) {
            toast({
                title: "For kort tekst",
                description: "Skriv venligst et lidt mere uddybende notat for at få kvalificeret feedback.",
                variant: "destructive"
            });
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await evaluateJournalEntryAction({
                scenario: selectedScenario,
                journalContent,
                profession: userProfile?.profession
            });
            if (res.data) {
                setFeedback(res.data);
                setStep('feedback');
            }
        } catch (err) {
            toast({ title: "Fejl", description: "Kunne ikke analysere dit notat.", variant: "destructive" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20">
            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/portal" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <FileText className="w-4 h-4" />
                            </div>
                            <span className="font-black serif text-lg tracking-tight">Journal-Træner <span className="text-indigo-600 text-xs font-black uppercase tracking-widest ml-1 px-2 py-0.5 bg-indigo-50 rounded-full">v2.0</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Mentor Aktiv</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 pt-12">
                <AnimatePresence mode="wait">
                    {step === 'selection' && (
                        <motion.div 
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <div className="max-w-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-5xl font-black text-slate-900 serif leading-[1.1] mb-6">
                                        Bliv mester i den <span className="text-indigo-600">faglige journalisering.</span>
                                    </h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Træn din evne til at skrive præcise, objektive og juridisk holdbare journalnotater. Vælg et scenarie nedenfor eller generer et nyt.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => handleGenerateNewScenario()}
                                    disabled={isAnalyzing}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 py-8 h-auto font-black uppercase tracking-widest shadow-xl shrink-0"
                                >
                                    <Sparkles className="w-5 h-5 mr-2 text-indigo-400" />
                                    Generer Nyt Scenarie
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {INITIAL_SCENARIOS.map((scenario) => (
                                    <div 
                                        key={scenario.id}
                                        onClick={() => handleStartScenario(scenario)}
                                        className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                            <BrainCircuit className="w-24 h-24" />
                                        </div>
                                        <div className="flex flex-col h-full gap-6 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    {scenario.category}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    <Zap className="w-3 h-3 text-amber-400" />
                                                    {scenario.difficulty}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 serif mb-3 group-hover:text-indigo-600 transition-colors">{scenario.title}</h3>
                                                <p className="text-sm text-slate-500 font-medium line-clamp-2">{scenario.context}</p>
                                            </div>
                                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                    <Scale className="w-3.5 h-3.5" />
                                                    {scenario.legalReference}
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'writing' && (
                        <motion.div 
                            key="writing"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid lg:grid-cols-12 gap-8 items-start"
                        >
                            {/* Scenario Info */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 serif">Opgaven</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Kontekst
                                            </p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                {selectedScenario.context}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Zap className="w-3 h-3" /> Mål
                                            </p>
                                            <p className="text-sm text-indigo-900 leading-relaxed font-bold italic">
                                                {selectedScenario.objective}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setStep('selection')}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-3 h-3" /> Skift Scenarie
                                </button>
                            </div>

                            {/* Editor */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col min-h-[600px]">
                                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Journal-Editor</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                {journalContent.length} tegn
                                            </span>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={journalContent}
                                        onChange={(e) => setJournalContent(e.target.value)}
                                        placeholder="Begynd at skrive dit journalnotat her..."
                                        className="flex-1 w-full p-10 text-lg font-medium text-slate-700 bg-transparent border-none outline-none resize-none placeholder:text-slate-200 leading-relaxed"
                                    />
                                    <div className="p-8 border-t border-slate-50 bg-white flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button className="p-3 text-slate-300 hover:text-indigo-600 transition-colors">
                                                <BrainCircuit className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <Button 
                                            onClick={handleSubmitForFeedback}
                                            disabled={isAnalyzing}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-6 h-auto font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 group"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                                    Analyserer...
                                                </>
                                            ) : (
                                                <>
                                                    Få Feedback
                                                    <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'feedback' && (
                        <motion.div 
                            key="feedback"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Analyse Færdig</div>
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 serif leading-none">Din Evaluering</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Score</p>
                                        <div className="text-5xl font-black text-slate-900 serif">{feedback.score}<span className="text-xl text-slate-300">/100</span></div>
                                    </div>
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white ${feedback.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'} shadow-2xl`}>
                                        <Trophy className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Dimensions Grid */}
                                <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                                    {feedback.dimensions.map((dim: any, idx: number) => (
                                        <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-xl transition-all duration-500">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{dim.label}</h4>
                                                <span className="text-lg font-black text-indigo-600 serif">{dim.score}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${dim.score}%` }}
                                                    transition={{ delay: idx * 0.1, duration: 1 }}
                                                    className="h-full bg-indigo-500 rounded-full"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-indigo-50 pl-4">
                                                {dim.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Sparkles className="w-20 h-20" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black serif mb-4 flex items-center gap-3">
                                                <BrainCircuit className="w-6 h-6 text-indigo-400" />
                                                AI Indsigt
                                            </h3>
                                            <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                                {feedback.summary}
                                            </p>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => {
                                            setStep('writing');
                                            setFeedback(null);
                                        }}
                                        variant="outline"
                                        className="w-full py-6 rounded-[2rem] border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all h-auto"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" /> Prøv Igen
                                    </Button>

                                    <Button 
                                        onClick={() => {
                                            setStep('selection');
                                            setFeedback(null);
                                            setJournalContent('');
                                        }}
                                        className="w-full py-6 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/10 transition-all h-auto"
                                    >
                                        Næste Opgave
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

const Trophy = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);
