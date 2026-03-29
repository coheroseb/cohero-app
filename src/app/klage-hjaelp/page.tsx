
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  FileText, 
  AlertCircle,
  ChevronRight,
  Info,
  Scale,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { draftComplaintAction } from './actions';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

const KlageHjaelpPage = () => {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState<{ draft: string; status: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch history for selection
  useEffect(() => {
    if (!user || !firestore) return;
    
    const q = query(
        collection(firestore, 'users', user.uid, 'secondOpinions'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Filtrér til de analyser hvor der enten er fundet misforhold eller klagen er berettiget
        const undervaluedOnly = records.filter((r: any) => {
          const a = r.analysis || {};
          return r.isUndervalued === true || a.isComplaintJustified === true || a.isGradeAccurate === false;
        });
        
        setHistory(undervaluedOnly);
        setIsLoadingHistory(false);
        
        // Initialisering af aktiv analyse
        if (!analysis && undervaluedOnly.length > 0) {
            const sessionData = typeof window !== 'undefined' ? sessionStorage.getItem('lastSecondOpinion') : null;
            if (sessionData) {
                try {
                  const parsed = JSON.parse(sessionData);
                  // Sikr os at vi bruger den rigtige format fra session
                  setAnalysis(parsed);
                } catch (e) {
                  setAnalysis(undervaluedOnly[0].analysis);
                }
            } else {
                const latest = undervaluedOnly[0];
                setAnalysis({
                    ...latest.analysis,
                    id: latest.id,
                    grade: latest.input?.grade || '?',
                    institution: latest.institution || userProfile?.institution,
                    profession: latest.profession || userProfile?.profession
                });
            }
        }
    });

    return () => unsubscribe();
  }, [user, firestore, userProfile?.institution, userProfile?.profession]); // Fjern 'analysis' fra deps

  const handleGenerateDraft = async () => {
    if (!analysis) return;
    setIsGenerating(true);
    try {
      const result = await draftComplaintAction({
        analysisResult: analysis,
        userProfile: {
          institution: userProfile?.institution,
          profession: userProfile?.profession
        }
      });
      setDraftResult(result);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "Fejl ved generering",
        description: err.message || "Kunne ikke generere klageudkast."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (draftResult) {
       // Strip HTML tags for plain text copying if needed, or keep it.
       // Students usually want it for email or Word.
       const plainText = draftResult.draft.replace(/<[^>]*>/g, '');
       navigator.clipboard.writeText(plainText);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
       toast({ title: "Kopieret", description: "Klageudkastet er kopieret til din udklipsholder." });
    }
  };

  if (isUserLoading) return <AuthLoadingScreen />;
  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-amber-950 px-4 py-12 md:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
             <Link href="/second-opinion" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Tilbage til Second Opinion
             </Link>
             <h1 className="text-4xl md:text-6xl font-black serif tracking-tighter leading-none">Klage-Hjælp</h1>
             <p className="text-slate-500 font-medium max-w-xl">Vi hjælper dig med at omsætte din faglige kritik til en saglig, formel klage over din karakter.</p>
          </div>
          
          {history.length > 0 && (
            <div className="flex-1 max-w-xs ml-auto">
               <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Vælg en anden analyse</label>
               <select 
                  className="w-full bg-white border border-amber-100 py-3 px-4 rounded-xl text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-50 outline-none shadow-sm cursor-pointer"
                  value={analysis?.id || ''}
                  onChange={(e) => {
                    const selected = history.find(h => h.id === e.target.value);
                    if (selected) {
                      setAnalysis({
                        ...selected.analysis,
                        id: selected.id,
                        grade: selected.input.grade,
                        institution: userProfile?.institution,
                        profession: userProfile?.profession
                      });
                      setDraftResult(null); // Ryd tidligere udkast når vi skifter
                    }
                  }}
               >
                  {history.map((h: any) => (
                    <option key={h.id} value={h.id}>
                       {h.createdAt?.toDate ? h.createdAt.toDate().toLocaleDateString('da-DK') : 'Tidligere'} - Modtaget Karakter {h.input.grade}
                    </option>
                  ))}
               </select>
            </div>
          )}

          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-amber-100 shadow-sm relative">
                <Gavel className="w-8 h-8 text-amber-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
             </div>
          </div>
        </div>

        {!analysis && !isLoadingHistory && (
          <div className="bg-rose-50 border border-rose-100 p-12 rounded-[3.5rem] text-center space-y-6">
             <AlertCircle className="w-12 h-12 text-rose-300 mx-auto" />
             <h3 className="text-2xl font-black text-rose-950 serif">Ingen berettigede klager fundet</h3>
             <p className="text-sm text-rose-500/70 max-w-sm mx-auto leading-relaxed">Du har ikke nogen analyser i din historik, hvor characters er vurderet som "under vurderet". Du skal gennemføre en Second Opinion-analyse først.</p>
             <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" className="rounded-2xl border-rose-200 text-rose-600 px-8" asChild>
                    <Link href="/second-opinion">Gå til Second Opinion</Link>
                </Button>
             </div>
          </div>
        )}
        
        {isLoadingHistory && (
           <div className="py-32 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-200 mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Indlæser dine analyser...</p>
           </div>
        )}

        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             {/* Left: Summary of why we are here */}
             <div className="lg:col-span-12 space-y-8">
                <div className="bg-amber-950 p-10 md:p-14 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Fundament for klagen</span>
                         <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5"><Scale className="w-3 h-3" /> Berettiget klage fundet</span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Institution</p>
                            <p className="text-xl font-bold serif text-white">{analysis.institution || 'Ikke angivet'}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Modul</p>
                            <p className="text-xl font-bold serif text-white">{analysis.moduleName || 'Ikke angivet'}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Modtaget Karakter</p>
                            <p className="text-4xl font-black serif text-amber-400">{analysis.grade || '?'}</p>
                         </div>
                      </div>

                      <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-4">
                         <h4 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2"><Info className="w-4 h-4" /> Analyse-Sammendrag</h4>
                         <div className="prose prose-invert prose-sm max-w-none text-white/70 italic leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: analysis.gradeAccuracyArgument }} />
                      </div>

                      {!draftResult && (
                        <div className="flex justify-center pt-8">
                           <Button 
                              onClick={handleGenerateDraft} 
                              disabled={isGenerating}
                              className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black uppercase text-xs tracking-[0.3em] h-20 px-12 rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-4 disabled:opacity-50"
                           >
                             {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                             {isGenerating ? 'Genererer klage...' : 'Generér Officiel Klage'}
                           </Button>
                        </div>
                      )}
                   </div>
                </div>

                <AnimatePresence>
                  {draftResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                       {/* Complaint Draft */}
                       <div className="bg-white p-12 md:p-16 rounded-[4rem] border border-amber-200 shadow-xl space-y-8 relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full blur-2xl -z-10" />
                          <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <h3 className="text-2xl font-black serif text-amber-950">Dit Klageudkast</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Klar til kopiering</p>
                             </div>
                             <button 
                                onClick={handleCopy}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${copied ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-amber-100 text-amber-600 hover:bg-amber-50'}`}
                             >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                             </button>
                          </div>
                          
                          <div className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] font-serif italic text-slate-700 leading-relaxed max-h-[600px] overflow-y-auto draft-content shadow-inner">
                             <div dangerouslySetInnerHTML={{ __html: draftResult.draft }} />
                          </div>

                          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                             <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                             <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                               <strong>Vigtigt:</strong> Dette er et AI-genereret udkast. Vi anbefaler at du læser det grundigt igennem og personliggør det, før du sender det afsted.
                             </p>
                          </div>
                       </div>

                       {/* Process Guide */}
                       <div className="space-y-8">
                          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                             <h4 className="text-xl font-black serif text-amber-950 flex items-center gap-3">
                                <Send className="w-5 h-5 text-indigo-500" /> Næste skridt
                             </h4>
                             
                             <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">1</div>
                                   <div className="space-y-1">
                                      <p className="text-sm font-bold">Respektér tidsfristen</p>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">De fleste uddannelsessteder har en frist på <strong>2 uger</strong> efter karakteren er offentliggjort.</p>
                                   </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">2</div>
                                   <div className="space-y-1">
                                      <p className="text-sm font-bold">Mail til studieadministrationen</p>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">Send klagen direkte til din studieadministration eller studienævn som vedhæftet PDF eller i mailteksten.</p>
                                   </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">3</div>
                                   <div className="space-y-1">
                                      <p className="text-sm font-bold">Vær forberedt på ventetid</p>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">Behandlingstiden kan variere fra 4 uger til 3 måneder afhængig af institutionen.</p>
                                   </div>
                                </div>
                             </div>

                             <div className="pt-8 border-t border-slate-100">
                                <div dangerouslySetInnerHTML={{ __html: draftResult.status }} className="prose prose-sm prose-slate" />
                             </div>
                          </div>

                          <div className="bg-amber-950 p-10 rounded-[3rem] text-center space-y-4">
                             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <Sparkles className="w-6 h-6 text-amber-400" />
                             </div>
                             <h4 className="text-white font-black serif text-xl">Held og lykke!</h4>
                             <p className="text-white/40 text-[11px] font-medium leading-relaxed">Husk at en saglig klage altid er din ret som studerende, hvis du føler dig uretfærdigt behandlet.</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KlageHjaelpPage;
