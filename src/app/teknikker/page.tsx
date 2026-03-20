
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Lightbulb, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Bookmark, 
  Search, 
  Sparkles, 
  MessageSquare,
  Zap,
  Coffee,
  Brain,
  GraduationCap,
  Loader2,
  X,
  BrainCircuit,
  Send,
  Target,
  Flame,
  TrendingUp,
  History,
  Layers,
  ChevronLeft,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useApp } from '@/app/provider';
import { recommendTechniqueAction, sendEmailToConsultant } from '@/app/actions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

interface Technique {
  id: string;
  title: string;
  content: string;
  order: number;
  isPremium?: boolean;
}

const ConsultantContactForm = () => {
    const { user, userProfile } = useApp();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim() || isSending || !user) return;

        setIsSending(true);
        setStatus(null);
        
        try {
            const userName = userProfile?.username || user.displayName || 'Anonym';
            const userEmail = user.email || 'Ingen email';
            
            const result = await sendEmailToConsultant(subject, message, userName, userEmail);
            setStatus(result);
            if (result.success) {
                setSubject('');
                setMessage('');
                setTimeout(() => setStatus(null), 5000);
            }
        } catch (error) {
            console.error(error);
            setStatus({type: 'error', message: 'Der skete en uventet fejl under afsendelse.'});
        } finally {
            setIsSending(false);
        }
    };

    return (
        <section className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                  <Image src="/team/jul.png" alt="Julie Lee Hansen" width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-amber-950 serif">Spørg Julie</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uddannelseskonsulent</p>
                </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 italic leading-relaxed">
                Har du spørgsmål til studieteknikker eller eksamensstrategi? Skriv direkte til Julie her.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Emne..."
                    className="bg-amber-50/30 border-amber-100 rounded-xl"
                    required
                />
                <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Din besked..."
                    rows={4}
                    className="bg-amber-50/30 border-amber-100 rounded-xl"
                    required
                />
                <div className="flex justify-end items-center gap-4 pt-2">
                    {status && <p className={`text-[10px] font-bold ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>}
                    <Button type="submit" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg" disabled={isSending || !subject.trim() || !message.trim()}>
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? 'Sender...' : 'Send'}
                    </Button>
                </div>
            </form>
        </section>
    );
};

const StudyCornerPageContent: React.FC = () => {
  const { user, userProfile, isUserLoading, openAuthModal } = useApp();
  const router = useRouter();
  const firestore = useFirestore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [aiTipQuery, setAiTipQuery] = useState('');
  const [isSearchingTip, setIsSearchingTip] = useState(false);
  const [tipSearchResult, setTipSearchResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightQuote, setHighlightQuote] = useState<string | null>(null);

  const techniquesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'techniques'), orderBy('order', 'asc')) : null),
    [firestore]
  );
  const { data: techniques, isLoading: techniquesLoading } = useCollection<Technique>(techniquesQuery);

  const filteredTechniques = useMemo(() => {
    if (!techniques) return [];
    return techniques.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [techniques, searchQuery]);

  const handleTechniqueClick = (technique: Technique) => {
    const isPremiumUser = userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership);
    
    if (technique.isPremium && !isPremiumUser) {
      router.push('/upgrade');
    } else {
      setHighlightQuote(null);
      setSelectedTechnique(technique);
    }
  };

  const handleQuickTipSearch = async () => {
    if (!aiTipQuery || !techniques) return;
    setIsSearchingTip(true);
    setTipSearchResult(null);
    setError(null);
    
    try {
        const response = await recommendTechniqueAction({
            challenge: aiTipQuery,
            techniques: techniques,
        });

        const recommendations = response.data.recommendations;

        if (recommendations && recommendations.length > 0) {
            const topRecommendation = recommendations[0];
            const recommendedTechnique = techniques.find(t => t.id === topRecommendation.id);

            if (recommendedTechnique) {
                const isPremiumUser = userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership);
                if (recommendedTechnique.isPremium && !isPremiumUser) {
                    router.push('/upgrade');
                    return;
                }
                setHighlightQuote(topRecommendation.quote);
                setSelectedTechnique(recommendedTechnique);
                setTipSearchResult(`Vi fandt '${recommendedTechnique.title}' som den mest relevante teknik for dig.`);
            } else {
                setTipSearchResult('Kunne ikke finde en specifik teknik. Prøv at søge manuelt i listen.');
            }
        } else {
            setTipSearchResult('Vi kunne desværre ikke finde en teknik, der matcher din udfordring. Prøv at formulere dig anderledes eller søg manuelt.');
        }

    } catch (e) {
      setError('Der skete en fejl under søgningen. Prøv igen.');
      console.error(e);
    } finally {
      setIsSearchingTip(false);
    }
  };

  const closeModal = () => {
    setSelectedTechnique(null);
    setHighlightQuote(null);
  };

  const modalContentRef = useRef<HTMLDivElement>(null);

  const highlightedContent = useMemo(() => {
    if (!selectedTechnique || !highlightQuote) {
      return selectedTechnique?.content || '';
    }
    const escapedQuote = highlightQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return selectedTechnique.content.replace(
      new RegExp(escapedQuote, 'g'),
      `<mark id="highlight-target" class="bg-amber-200 px-1 rounded">${highlightQuote}</mark>`
    );
  }, [selectedTechnique, highlightQuote]);

  useEffect(() => {
    if (selectedTechnique && highlightQuote && modalContentRef.current) {
      const timer = setTimeout(() => {
        const target = modalContentRef.current?.querySelector('#highlight-target');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedTechnique, highlightQuote]);

  return (
    <div className="animate-fade-in-up bg-[#FDFCF8] min-h-screen selection:bg-amber-100 overflow-x-hidden">
      
      {/* 1. SMART COMMAND HEADER */}
      <header className="bg-white border-b border-amber-100 px-4 sm:px-6 py-10 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-amber-50 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-10 mb-10 md:mb-16">
            <div className="text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="px-3 md:px-4 py-1.5 bg-amber-950 text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/10">
                  Studieteknikker
                </span>
                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-rose-100">
                  <Lightbulb className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" /> Strategisk dannelse
                </div>
              </div>
              <h1 className="text-4xl md:text-7xl font-bold text-amber-950 serif leading-none tracking-tighter">
                Dit faglige <span className="text-amber-700 italic">overskud.</span>
              </h1>
              <p className="text-base md:text-xl text-slate-500 mt-4 md:mt-6 italic font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Her finder du teknikker til at mestre pensum, strukturere din tid og gå til eksamen med ro i maven.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100/50 shadow-inner">
                <div className="text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Teknikker</p>
                    <p className="text-2xl font-black text-amber-950 serif">{techniques?.length || 0}</p>
                </div>
                <div className="w-[1px] h-8 bg-amber-100"></div>
                <div className="text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Kategori</p>
                    <p className="text-2xl font-black text-amber-950 serif">Studie</p>
                </div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl mx-auto lg:mx-0 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 rounded-[2rem] md:rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-50"></div>
              <div className="relative bg-white border border-amber-100 rounded-[1.8rem] md:rounded-[2.2rem] shadow-2xl overflow-hidden transition-all duration-500 group-focus-within:scale-[1.01]">
                <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-300 group-focus-within:text-amber-950 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Søg i teknikker, tips og artikler..."
                    className="w-full py-6 md:py-8 pl-16 md:pl-20 pr-24 md:pr-32 bg-transparent text-base md:text-xl font-medium focus:outline-none placeholder:text-slate-300 text-amber-950"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: TECHNIQUES */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* AI Assistant Box */}
            <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-2.5 bg-amber-50 rounded-xl shadow-inner">
                        <Sparkles className="w-5 h-5 text-amber-700" />
                    </div>
                    <h2 className="text-xl font-bold text-amber-950 serif">AI Studievejleder</h2>
                </div>
                
                <div className="bg-amber-950 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Hurtig Hjælp
                            </div>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold serif leading-tight">
                                Hvad kæmper du <br className="hidden sm:block"/><span className="text-amber-400 italic">med lige nu?</span>
                            </h3>
                            <div className="relative max-w-lg mx-auto md:mx-0">
                                <input 
                                    type="text" 
                                    placeholder="F.eks. 'eksamensangst' eller 'læsetræthed'..."
                                    value={aiTipQuery}
                                    onChange={(e) => setAiTipQuery(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm md:text-base"
                                />
                                <button 
                                    onClick={handleQuickTipSearch}
                                    disabled={isSearchingTip || !aiTipQuery}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-400 text-amber-950 rounded-xl hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {isSearchingTip ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                                </button>
                            </div>
                            {tipSearchResult && !isSearchingTip && (
                                <p className="text-amber-100/60 text-sm md:text-base italic animate-fade-in-up">
                                    {tipSearchResult}
                                </p>
                            )}
                        </div>
                        <div className="w-full md:w-64 h-56 md:h-64 bg-white/5 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-8 flex flex-col justify-center items-center text-center">
                            <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-950 mb-4 shadow-xl">
                                <BrainCircuit className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Anbefalet Teknik</p>
                            <p className="text-sm font-bold text-amber-50">Personlig Guide</p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
                </div>
            </section>

            {/* Techniques Grid */}
            <section>
                <div className="flex items-center gap-3 border-b border-amber-100 pb-6 mb-8 px-2">
                    <div className="p-2.5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                        <Layers className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-amber-950 serif">Bibliotek</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium">Alle teknikker og strategier</p>
                    </div>
                </div>

                {techniquesLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {filteredTechniques.map(technique => (
                            <div 
                                key={technique.id}
                                onClick={() => handleTechniqueClick(technique)}
                                className="group p-8 rounded-[2.5rem] border border-amber-100 bg-white hover:border-amber-950 hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col justify-between h-64"
                            >
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        <Brain className="w-6 h-6"/>
                                    </div>
                                    {technique.isPremium && (
                                        <span className="px-3 py-1 bg-amber-950 text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3"/> Kollega+
                                        </span>
                                    )}
                                </div>
                                
                                <div className="relative z-10">
                                    <h4 className="text-xl font-bold text-amber-950 serif group-hover:text-amber-700 transition-colors leading-tight mb-2">{technique.title}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Læs teknikken</p>
                                </div>

                                <div className="absolute bottom-8 right-8 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                    <ChevronRight className="w-6 h-6 text-amber-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
          </div>

          {/* RIGHT COLUMN: ASIDE */}
          <aside className="lg:col-span-4 space-y-10">
            <ConsultantContactForm />

            <div className="bg-amber-950 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h3 className="text-lg font-bold serif mb-4">Studie-Tip</h3>
                <p className="text-amber-100/60 text-sm leading-relaxed mb-6 italic">
                    "Effektiv læring handler ikke om hvor mange timer du bruger, men hvordan du bruger dem. Husk pauser og aktiv genkaldelse."
                </p>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Husk din Pomodoro-pause</p>
                </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ARTICLE MODAL */}
      <AnimatePresence>
        {selectedTechnique && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-amber-950/70 backdrop-blur-xl" 
                    onClick={closeModal}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-[#FDFCF8] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="p-8 border-b border-amber-50 bg-white flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-amber-950 serif truncate max-w-md">{selectedTechnique.title}</h2>
                        </div>
                        <button 
                            onClick={closeModal}
                            className="p-3 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all text-amber-900 group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div ref={modalContentRef} className="flex-1 overflow-y-auto p-10 md:p-14">
                        <div className="max-w-2xl mx-auto">
                            <div 
                                className="prose prose-amber max-w-none text-slate-700 leading-[1.8] prose-headings:serif prose-headings:text-amber-950" 
                                dangerouslySetInnerHTML={{ __html: highlightedContent }} 
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-white border-t border-amber-100 px-6 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                      <BrainCircuit className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Studiedannelse</span>
                  </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Klar til sparring</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

const StudyCornerPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  return <StudyCornerPageContent />;
};

export default StudyCornerPage;
