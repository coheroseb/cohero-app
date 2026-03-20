
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, limit, getDoc, orderBy } from 'firebase/firestore';
import { Sparkles, MessageSquare, BarChart, Star, Send, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Survey {
  id: string;
  title: string;
  description: string;
  type: 'poll' | 'question' | 'assessment';
  targetGroup: string;
  options?: string[];
}

const SurveyWidget = ({ membership }: { membership: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseValue, setResponseValue] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user || !firestore || isDismissed) return;

    const findSurvey = async () => {
      setIsLoading(true);
      try {
        const groups = ['all', membership];
        const surveysRef = collection(firestore, 'surveys');
        
        // Simplified query to avoid complex index requirements, then filter in memory
        const q = query(surveysRef, where('isActive', '==', true), limit(20));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setIsLoading(false);
          return;
        }

        // Sort by creation date in memory and find the first matching one the user hasn't responded to
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(d => groups.includes(d.targetGroup))
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

        for (const surveyData of docs) {
          const responseRef = doc(firestore, 'surveys', surveyData.id, 'responses', user.uid);
          const responseSnap = await getDoc(responseRef);
          if (!responseSnap.exists()) {
            setActiveSurvey(surveyData as Survey);
            setIsLoading(false);
            return;
          }
        }
        setIsLoading(false);
      } catch (e) {
        console.error("Error finding survey:", e);
        setIsLoading(false);
      }
    };

    findSurvey();
  }, [user, firestore, membership, isDismissed]);

  const handleSubmit = async (value: any) => {
    if (!user || !firestore || !activeSurvey || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const responseRef = doc(firestore, 'surveys', activeSurvey.id, 'responses', user.uid);
      await setDoc(responseRef, {
        surveyId: activeSurvey.id,
        userId: user.uid,
        response: value,
        createdAt: serverTimestamp()
      });
      setHasResponded(true);
      toast({ title: "Tak for dit svar!", description: "Dit input hjælper os med at forbedre Cohéro." });
      setTimeout(() => {
        setActiveSurvey(null);
        setHasResponded(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke sende dit svar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !activeSurvey || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white p-6 sm:p-8 rounded-[2rem] border border-amber-100 shadow-xl relative overflow-hidden group mb-10"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-20 h-20 text-amber-950" />
        </div>
        
        <button onClick={() => setIsDismissed(true)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-amber-950 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
              {activeSurvey.type === 'poll' ? <BarChart className="w-5 h-5"/> : activeSurvey.type === 'question' ? <MessageSquare className="w-5 h-5"/> : <Star className="w-5 h-5"/>}
            </div>
            <div>
              <h3 className="font-bold text-amber-950 serif text-lg">{activeSurvey.title}</h3>
              <p className="text-[10px] font-black uppercase text-amber-700/40 tracking-widest">Vi har brug for dit input</p>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed italic">
            {activeSurvey.description}
          </p>

          {hasResponded ? (
            <div className="flex flex-col items-center justify-center py-4 text-emerald-600 font-bold animate-ink">
              <CheckCircle2 className="w-10 h-10 mb-2" />
              <span>Svaret er gemt!</span>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSurvey.type === 'poll' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeSurvey.options?.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSubmit(opt)}
                      disabled={isSubmitting}
                      className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm font-bold text-amber-950 hover:bg-amber-950 hover:text-white hover:border-amber-950 transition-all text-left shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {activeSurvey.type === 'assessment' && (
                <div className="flex justify-center gap-4 py-4">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button 
                      key={val} 
                      onClick={() => handleSubmit(val)}
                      disabled={isSubmitting}
                      className="w-12 h-12 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-200 hover:text-amber-500 hover:border-amber-500 transition-all hover:scale-110 shadow-sm disabled:opacity-50"
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              )}

              {activeSurvey.type === 'question' && (
                <div className="space-y-4">
                  <textarea 
                    value={responseValue || ''}
                    onChange={e => setResponseValue(e.target.value)}
                    placeholder="Dit svar her..."
                    className="w-full p-4 bg-slate-50 border border-amber-100 rounded-2xl text-sm focus:ring-2 focus:ring-amber-950 focus:bg-white transition-all min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => handleSubmit(responseValue)} disabled={isSubmitting || !responseValue?.trim()} className="h-12 px-8 rounded-xl shadow-lg">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2" />}
                      Send svar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SurveyWidget;
