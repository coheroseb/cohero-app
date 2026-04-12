'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    BookOpen, 
    Layers, 
    Users, 
    MessageSquare, 
    FileText, 
    Lightbulb,
    ChevronDown,
    ArrowRight,
    Brain,
    Scale,
    Target,
    Zap,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeScientificParadigmAction } from '@/app/actions';
import { ScientificParadigmAnalysis } from '@/ai/flows/types';

const paradigms = [
    {
        id: 'realisme',
        name: 'Realisme',
        subtitle: 'Naiv realisme, samfundsvidenskabelig realisme, kritisk realisme',
        color: 'from-blue-500 to-cyan-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        details: {
            metodologi: 'Deduktiv, kvantitativ; søger at minimere bias; eksperimenter, surveys, statistik',
            forskningsspørgsmål: 'Søger love, årsager og virkninger',
            forskerens_rolle: '“Minearbejder”; objektiv og neutral observatør',
            informantens_rolle: '“Beholder af viden”; kilde til fakta',
            interviewspørgsmål: 'Lukkede, strukturerede, hypotesetestende',
            dokumentanalyse: 'Søger objektive fakta og sandhed',
        }
    },
    {
        id: 'faenomenologi',
        name: 'Fænomenologi',
        subtitle: 'Fortolkende tilgange',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        details: {
            metodologi: 'Induktiv, kvalitativ; fokus på refleksivitet og kontekst',
            forskningsspørgsmål: 'Forstå oplevelser, mening og livsverden',
            forskerens_rolle: '“Medrejsende”; viden skabes i samspil',
            informantens_rolle: 'Medskaber af viden i social kontekst',
            interviewspørgsmål: 'Åbne, udforskende, ustrukturerede',
            dokumentanalyse: 'Fortolker subjektive oplevelser og mening',
        }
    },
    {
        id: 'kritisk-teori',
        name: 'Kritisk teori',
        subtitle: 'Og kritisk realisme',
        color: 'from-amber-500 to-orange-500',
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        details: {
            metodologi: 'Dialektisk, historisk; diskursanalyse, aktionsforskning, kritisk analyse',
            forskningsspørgsmål: 'Afdække uretfærdighed, ulighed, magt (og positive tilfælde)',
            forskerens_rolle: '“Kritisk deltager”; udfordrer magtstrukturer',
            informantens_rolle: 'Deltager i og påvirket af magtstrukturer',
            interviewspørgsmål: 'Kritiske; afdækker ideologi og magt',
            dokumentanalyse: 'Afdækker ideologi, magt og dominans',
        }
    },
    {
        id: 'konstruktivisme',
        name: 'Konstruktivisme',
        subtitle: 'Socialkonstruktivisme, poststrukturalisme',
        color: 'from-purple-500 to-indigo-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        details: {
            metodologi: 'Refleksiv og kontekstafhængig; diskursanalyse, narrativ analyse, dekonstruktion, etnografi',
            forskningsspørgsmål: 'Fokus på normer, sprog, magt og subjektpositioner',
            forskerens_rolle: '“Medrejsende” / refleksiv deltager',
            informantens_rolle: 'Medskaber af viden; underlagt subjektificering',
            interviewspørgsmål: 'Fokus på sprog og normer; kan være ledende/provokerende',
            dokumentanalyse: 'Ser dokumenter som sproglige konstruktioner',
        }
    }
];

const strategies = [
    { name: 'Thick description', desc: 'Detaljeret kontekstualisering af sociale og kulturelle mønstre', icon: FileText },
    { name: 'Iterativ-induktiv analyse', desc: 'Løbende samspil mellem data og analyse; justering af forskningsspørgsmål', icon: Zap },
    { name: 'Tematisk analyse', desc: 'Identifikation af mønstre og temaer i data', icon: Layers },
    { name: 'Emiske vs. etiske begreber', desc: 'Skelnen mellem informanters egne begreber og forskerens analytiske', icon: Users },
    { name: 'Software', desc: 'NVivo, Atlas.ti, HyperResearch, AI', icon: Brain },
];

const dimensions = [
    { id: 'metodologi', label: 'Metodologi', icon: Layers },
    { id: 'forskningsspørgsmål', label: 'Forskningsspørgsmål', icon: Target },
    { id: 'forskerens_rolle', label: 'Forskerens rolle', icon: Users },
    { id: 'informantens_rolle', label: 'Informantens rolle', icon: Users },
    { id: 'interviewspørgsmål', label: 'Interviewspørgsmål', icon: MessageSquare },
    { id: 'dokumentanalyse', label: 'Dokumentanalyse', icon: FileText },
];

const ParadigmAnalyzer = () => {
    const [problemStatement, setProblemStatement] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<ScientificParadigmAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!problemStatement.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await analyzeScientificParadigmAction({ problemStatement });
            setResult(res.data);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <section className="bg-white rounded-[48px] border border-slate-200 p-8 sm:p-14 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                <Brain className="w-64 h-64 text-indigo-600" />
            </div>

            <div className="relative z-10 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-950 serif">Tjek din problemformulering</h2>
                        <p className="text-sm text-slate-500 font-medium tracking-wide">Få AI-sparring på dine videnskabsteoretiske valg</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <textarea 
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="Indtæt din problemformulering her... (f.eks. 'Hvordan oplever hjemløse unge mødet med det kommunale system?')"
                        className="w-full min-h-[160px] p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-lg font-medium text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none resize-none shadow-inner"
                    />
                    
                    <div className="flex justify-center sm:justify-start">
                        <Button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !problemStatement.trim()}
                            className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-950/10"
                        >
                            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Analysér problemformulering'}
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-16 space-y-10 pt-10 border-t border-slate-100"
                        >
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100/50">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4">
                                        <Info className="w-3.5 h-3.5" /> Ontologisk Perspektiv
                                    </h4>
                                    <p className="text-xl font-black text-slate-900 serif mb-3">{result.ontologi.perspective}</p>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.ontologi.explanation}</p>
                                </div>
                                <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100/50">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">
                                        <Info className="w-3.5 h-3.5" /> Epistemologisk Perspektiv
                                    </h4>
                                    <p className="text-xl font-black text-slate-900 serif mb-3">{result.epistemologi.perspective}</p>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.epistemologi.explanation}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Anbefalede Paradigmer</h4>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {result.recommendedParadigms.map((p, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-950 text-lg mb-1">{p.name}</p>
                                                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3">{p.why}</p>
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                        Styrke: {p.strength}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900 p-10 rounded-[40px] text-white space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <AlertTriangle className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row gap-10">
                                    <div className="flex-1 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Metodisk Rådgivning</h4>
                                        <p className="text-lg font-medium leading-relaxed italic text-slate-200">
                                            {result.methodologicalAdvice}
                                        </p>
                                    </div>
                                    <div className="flex-1 space-y-4 pt-10 md:pt-0 md:pl-10 border-t md:border-t-0 md:border-l border-white/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Kritisk Refleksion</h4>
                                        <p className="text-sm font-medium leading-relaxed text-slate-400">
                                            {result.criticalReflection}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default function VidenskabsteoriPage() {
    const [selectedParadigm, setSelectedParadigm] = useState<string | null>(paradigms[0].id);

    const paradigmInfo = paradigms.find(p => p.id === selectedParadigm);

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-slate-900 pb-20 selection:bg-indigo-100">
            {/* Header Section */}
            <header className="bg-white border-b border-slate-200 pt-20 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05)_0,transparent_70%)] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Scale className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Akademisk Værktøjskasse</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tight leading-[0.9] serif mb-8">
                        Videnskabs<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">teori</span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium max-w-2xl leading-relaxed">
                        Forstå de grundlæggende paradigmer og strategier bag din forskning og opgave. Vælg en tilgang herunder for at dykke ned i detaljerne.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-16 space-y-24">
                
                {/* Paradigm Selector & Comparison */}
                <section className="space-y-12">
                    <div className="flex flex-wrap gap-4">
                        {paradigms.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParadigm(p.id)}
                                className={`px-8 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all duration-300 border-2 ${
                                    selectedParadigm === p.id 
                                    ? `bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-950/20` 
                                    : `bg-white text-slate-400 border-slate-100 hover:border-slate-300`
                                }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedParadigm}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <div className="md:col-span-2 lg:col-span-1 space-y-6">
                                <div className={`p-10 rounded-[40px] border-2 shadow-sm ${paradigmInfo?.bgColor} ${paradigmInfo?.borderColor} h-full flex flex-col justify-between`}>
                                    <div>
                                        <h3 className={`text-4xl font-black serif mb-4 ${paradigmInfo?.textColor}`}>{paradigmInfo?.name}</h3>
                                        <p className="text-base font-bold text-slate-800/60 leading-relaxed uppercase tracking-widest text-[11px] mb-8">
                                            {paradigmInfo?.subtitle}
                                        </p>
                                        <div className="space-y-4">
                                            <p className="text-slate-600 font-medium leading-relaxed">
                                                Dette paradigme definerer, hvordan du ser på viden og virkelighed. Det påvirker alt fra dine spørgsmål til din analyse.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-10">
                                        <Button className="w-full h-14 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                                            Læs mere om {paradigmInfo?.name}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                {dimensions.map((dim) => (
                                    <div 
                                        key={dim.id}
                                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:border-indigo-100 transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                                            <dim.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{dim.label}</p>
                                            <p className="text-[15px] font-bold text-slate-800 leading-snug">
                                                {paradigmInfo?.details[dim.id as keyof typeof paradigmInfo.details]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </section>

                {/* New Analysis Tool Section */}
                <ParadigmAnalyzer />

                {/* Analysis Strategies Section */}
                <section className="bg-slate-950 rounded-[48px] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-10 blur-3xl bg-indigo-500 rounded-full"></div>
                    
                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-6 inline-block">
                                Forskningsstrategier
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-white serif leading-tight mb-8">
                                Centrale begreber & <span className="text-indigo-400">strategier</span>
                            </h2>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                                Uanset dit paradigme, findes der en række strategier, der er essentielle for at sikre kvaliteten i din undersøgelse.
                            </p>
                        </div>
                        
                        <div className="grid gap-4">
                            {strategies.map((strategy, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px] hover:bg-white/10 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <strategy.icon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-lg mb-1">{strategy.name}</h4>
                                            <p className="text-slate-400 text-sm font-medium leading-normal">{strategy.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ / AI Section */}
                <section className="max-w-4xl mx-auto p-12 bg-indigo-50 rounded-[48px] border border-indigo-100 text-center space-y-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200/50">
                        <Brain className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-slate-950 serif">Har du brug for hjælp til din metodologi?</h2>
                        <p className="text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
                            Vores AI kan hjælpe dig med at præcisere dit videnskabsteoretiske ståsted eller foreslå den rette interviewform til dit paradigme.
                        </p>
                    </div>
                    <Button 
                        onClick={() => document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        Spørg AI om Videnskabsteori
                    </Button>
                </section>

            </main>
        </div>
    );
}
