'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
    Star, 
    MessageCircle, 
    Send, 
    CheckCircle2, 
    Share2, 
    Building2, 
    User, 
    Mail, 
    ArrowRight, 
    Sparkles, 
    ArrowLeft,
    ChevronDown,
    Zap,
    Quote,
    ShieldOff,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InstitutionSearch from './InstitutionSearch';
import { submitPublicReviewAction } from './actions';
import { searchInstitutionsAction } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

function PraktikRatingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedInst, setSelectedInst] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Fetch institution if ID is in searchParams
    useEffect(() => {
        const fetchInitialInst = async () => {
            const instId = searchParams?.get('id');
            if (instId && !selectedInst) {
                // We'll use the searchInstitutionsAction or equivalent to get a specific one
                const res = await searchInstitutionsAction("", instId);
                if (res && res.length > 0) {
                    setSelectedInst(res[0]);
                    setStep(2);
                }
            }
        };
        fetchInitialInst();
    }, [searchParams, selectedInst]);

    const handleRatingSelect = (s: number) => {
        setRating(s);
    };

    const handleSubmit = async () => {
        if (!selectedInst || rating === 0 || !reviewText.trim()) return;
        if (!isAnonymous && !userName.trim()) return;

        setIsSubmitting(true);
        const res = await submitPublicReviewAction({
            institutionId: selectedInst.id,
            institutionName: selectedInst.INST_NAVN,
            rating,
            reviewText,
            userName: isAnonymous ? 'Anonym' : userName,
            userEmail,
            isAnonymous
        });

        if (res.success) {
            setIsFinished(true);
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        // Simple visual feedback
        alert('Link kopieret til udklipsholder!');
    };

    if (isFinished) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full bg-white rounded-[4rem] p-12 lg:p-16 text-center shadow-2xl border border-emerald-50 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-inner">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 serif mb-6 tracking-tight">Tusind tak for din hjælp!</h2>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
                        Din vurdering af <span className="text-slate-900 font-bold">{selectedInst.INST_NAVN}</span> er blevet gemt og vil hjælpe medstuderende med at finde det rette praktiksted.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={copyLink}
                            className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Del siden med andre
                        </button>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="flex items-center justify-center gap-3 py-5 bg-amber-50 text-amber-950 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-amber-100 transition-all"
                        >
                            Tilbage til forsiden
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-rose-100 selection:text-rose-950">
            
            {/* PROGRESS BAR */}
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-100 z-[100]">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                    className="h-full bg-rose-500 rounded-r-full shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                />
            </div>

            {/* HEADER / NAVIGATION */}
            <header className="fixed top-0 left-0 right-0 p-8 z-[90] pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : window.location.href = '/'}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center text-slate-900 shadow-sm hover:scale-110 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 md:gap-4 px-6 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trin {step} af 4</span>
                        <div className="flex gap-1">
                            {[1,2,3,4].map(s => (
                                <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-rose-500' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block"></div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col items-center pt-32 pb-40 px-6 max-w-5xl mx-auto w-full relative">
                
                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-100/30 blur-[100px] rounded-full -z-10" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-rose-50/30 blur-[100px] rounded-full -z-10" />

                <AnimatePresence>
                    {/* STEP 1: SELECT INSTITUTION */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full text-center space-y-12"
                        >
                            <div className="space-y-6">
                                <Reveal>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-900/40">Hjælp dine medstuderende</span>
                                    </div>
                                </Reveal>
                                <Reveal delay={0.1}>
                                    <h1 className="text-[40px] leading-[1.05] sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-[-0.04em] serif">
                                        Bedøm dit <br />
                                        <span className="text-rose-500">praktiksted.</span>
                                    </h1>
                                </Reveal>
                                <Reveal delay={0.2}>
                                    <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                                        Hvilken institution var du ude på? Søg og find den i vores register for at komme i gang.
                                    </p>
                                </Reveal>
                            </div>

                            <Reveal delay={0.3}>
                                <InstitutionSearch 
                                    onSelect={(inst) => {
                                        setSelectedInst(inst);
                                        if (inst) setTimeout(() => setStep(2), 600);
                                    }} 
                                    selectedId={selectedInst?.id}
                                />
                            </Reveal>

                        </motion.div>
                    )}

                    {/* STEP 2: RATING */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            className="w-full text-center space-y-12"
                        >
                            <div className="space-y-4">
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">{selectedInst?.INST_NAVN}</p>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] serif">
                                    Hvordan var din <br /> <span className="text-rose-500 italic">oplevelse?</span>
                                </h1>
                            </div>

                            <div className="flex justify-center gap-3 md:gap-5 py-10">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <motion.button
                                        key={s}
                                        whileHover={{ scale: 1.1, y: -5 }}
                                        whileTap={{ scale: 0.9 }}
                                        onMouseEnter={() => setHoverRating(s)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => handleRatingSelect(s)}
                                        className="relative"
                                    >
                                        <div className={`w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-[2rem] flex items-center justify-center transition-all shadow-xl border-2 ${s <= (hoverRating || rating) ? 'border-amber-400 text-amber-400' : 'border-slate-50 text-slate-200'}`}>
                                            <Star className={`w-8 h-8 sm:w-12 sm:h-12 ${s <= (hoverRating || rating) ? 'fill-current' : ''}`} />
                                        </div>
                                        {s === (hoverRating || rating) && (
                                            <motion.div 
                                                layoutId="label"
                                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
                                                    {['Dårlig', 'Rimelig', 'God', 'Rigtig god', 'Fremragende'][s-1]}
                                                </span>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <AnimatePresence>
                                {rating > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-6 pt-10"
                                    >
                                        <button 
                                            onClick={() => setStep(3)}
                                            className="group flex items-center justify-center gap-4 px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-rose-900/30 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Fortsæt til din bedømmelse
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Klik på knappen for at fortsætte</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* STEP 3: COMMENT AND DETAILS */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Næsten i mål ({rating}/5 stjerner)</p>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight serif">
                                    Skriv lidt om <span className="text-rose-500 italic">opholdet.</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium">Del dine tanker anonymt eller med dit navn.</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Din bedømmelse</label>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-slate-100'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute top-6 left-6 text-rose-200">
                                            <Quote className="w-8 h-8 rotate-180" />
                                        </div>
                                        <textarea 
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Hvordan var vejledningen? Hvad lærte du?..."
                                            className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] p-12 text-lg font-medium text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all resize-none h-64 shadow-2xl shadow-slate-950/5"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-center">
                                    <button 
                                        disabled={!reviewText.trim()}
                                        onClick={() => setStep(4)}
                                        className="group flex items-center justify-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        Næste skridt
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: USER INFO & SUBMIT */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Hvem skriver?</p>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight serif">
                                    Lige til <span className="text-rose-500 italic">sidst...</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium">Vi bruger dit navn til at verificere din bedømmelse.</p>
                            </div>

                            <div className="max-w-xl mx-auto space-y-6 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col">
                                
                                <button 
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${isAnonymous ? 'border-amber-400 bg-amber-50' : 'border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isAnonymous ? 'bg-white text-amber-600 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                            {isAnonymous ? <ShieldOff className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-xs font-black uppercase tracking-widest ${isAnonymous ? 'text-amber-700' : 'text-slate-400'}`}>Anonym Bedømmelse</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{isAnonymous ? 'Dit navn bliver ikke vist offentligt' : 'Dit navn vises ved bedømmelsen'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isAnonymous ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200'}`}>
                                        {isAnonymous && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                </button>

                                <AnimatePresence mode="wait">
                                    {!isAnonymous && (
                                        <motion.div 
                                            key="name-field"
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Fulde Navn</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-6 flex items-center text-slate-300">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <input 
                                                    type="text"
                                                    value={userName}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    placeholder="Dit navn"
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-16 pr-8 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2 pt-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">E-mail (Valgfrit)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-6 flex items-center text-slate-300">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input 
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="din@email.dk"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-16 pr-8 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-8">
                                        <Zap className="w-4 h-4 text-rose-500" />
                                        <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest leading-relaxed">
                                            Ved at indsende godkender du vores betingelser for anmeldelser.
                                        </p>
                                    </div>
                                    
                                    <button 
                                        disabled={isSubmitting || (!isAnonymous && !userName.trim())}
                                        onClick={handleSubmit}
                                        className="w-full flex items-center justify-center gap-4 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[12px] shadow-2xl shadow-rose-900/40 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                    >
                                        {isSubmitting ? 'Sender...' : 'Indsend bedømmelse'}
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* FOOTER BADGE */}
            <footer className="fixed bottom-0 left-0 right-0 p-8 z-[90] pointer-events-none flex justify-center">
                <div className="px-6 py-2 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="flex -space-x-1 items-end h-3">
                        <div className="w-0.5 h-full bg-amber-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-amber-500 rounded-full" />
                        <div className="w-0.5 h-full bg-amber-600 rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">En del af Cohéro</span>
                </div>
            </footer>
        </div>
    );
}

export default function PraktikRatingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}>
            <PraktikRatingContent />
        </Suspense>
    );
}
