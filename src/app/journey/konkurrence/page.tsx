
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

export default function CompetitionPage() {
  const firestore = useFirestore();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!firestore) throw new Error('Firestore not initialized');
      await addDoc(collection(firestore, 'competition_entries'), {
        name: name.trim(),
        timestamp: serverTimestamp(),
        source: 'journey_qr'
      });

      setIsSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb923c', '#fbbf24']
      });
    } catch (err) {
      console.error('Error submitting competition entry:', err);
      setError('Der skete en fejl. Prøv venligst igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-rose-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="mb-8 text-center">
          <Link href="/journey" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium mb-8">
            <ArrowLeft className="w-4 h-4" />
            Tilbage til rejsen
          </Link>
          
          <div className="inline-block p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">Deltag i Konkurrencen</h1>
          <p className="text-slate-400 font-medium">
            Skriv dit navn nedenfor for at deltage i lodtrækningen om eksklusive Cohéro fordele.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                  Dit Fulde Navn
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Jensen Jensen"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              {error && (
                <p className="text-rose-500 text-sm font-medium text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full bg-white text-slate-950 h-16 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    Deltag Nu
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Du er nu med!</h2>
                <p className="text-emerald-500/80 font-medium">
                  Tak fordi du deltog. Vi trækker lod snart og giver besked direkte.
                </p>
              </div>
              <Link 
                href="/journey" 
                className="inline-block text-sm font-black uppercase tracking-widest text-white border-b-2 border-emerald-500/30 hover:border-emerald-500 transition-all pb-1"
              >
                Gå tilbage til rejsen
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
          Cohéro © 2026 • Dine data er sikre hos os
        </p>
      </motion.div>
    </div>
  );
}
