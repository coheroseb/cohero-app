'use client';

import React, { useState } from 'react';
import { Mail, Send, Sparkles, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const BookSpine: React.FC<{
  height: string;
  width: string;
  color: string;
  tilt?: string;
}> = ({ height, width, color, tilt = '' }) => (
  <div
    className={`relative flex flex-col items-center justify-end ${width} ${height} ${color} 
    rounded-t-[2px] shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3),inset_1px_0_2px_rgba(255,255,255,0.1),2px_0_5px_rgba(0,0,0,0.2)] 
    transition-all duration-300 ease-out
    ${tilt} border-r border-black/10`}
  >
    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')] pointer-events-none"></div>
  </div>
);

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firestore || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const waitlistRef = doc(firestore, 'waitlist', email.trim().toLowerCase());
      await setDoc(waitlistRef, {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to save email:', err);
      setError('Der skete en fejl. Prøv venligst igen.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-60"></div>

      <div className="relative z-10">
        <div className="flex items-end -space-x-[1px] justify-center h-16 mb-12">
            <BookSpine width="w-4" height="h-10" color="bg-stone-700" tilt="-rotate-2" />
            <BookSpine width="w-5" height="h-14" color="bg-amber-950" />
            <BookSpine width="w-5" height="h-12" color="bg-amber-800" />
            <BookSpine width="w-5" height="h-16" color="bg-amber-950" tilt="-rotate-1" />
            <BookSpine width="w-5" height="h-14" color="bg-amber-900" />
            <BookSpine width="w-5" height="h-12" color="bg-amber-950" />
            <BookSpine width="w-4" height="h-10" color="bg-stone-800" tilt="rotate-2" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-amber-950 serif mb-4">Cohéro er på vej.</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Vi åbner dørene for fremtidens socialrådgivere den <span className="font-bold text-amber-800">31. januar 2026</span>.
        </p>

        <div className="max-w-md mx-auto mb-12">
          {!submitted ? (
            <>
              <p className="font-bold text-amber-900 mb-2">Vær blandt de første til at få adgang.</p>
              <p className="text-sm text-slate-600 mb-4">De første 10, der tilmelder sig, får en kode til <span className="font-bold text-amber-800">1 måneds gratis Kollega+</span> ved lancering.</p>
              <form onSubmit={handleSubmit} className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Indtast din e-mailadresse..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-28 h-14 rounded-full bg-white shadow-inner"
                  required
                  disabled={loading}
                />
                <Button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-5 group">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : (
                    <>
                      Skriv mig op
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
              {error && <p className="text-xs text-center text-red-500 mt-2">{error}</p>}
            </>
          ) : (
            <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl flex items-center justify-center gap-4 border border-emerald-200">
                <CheckCircle className="w-8 h-8 text-emerald-600"/>
                <div>
                    <h3 className="font-bold">Tak for din tilmelding!</h3>
                    <p className="text-sm">Du hører fra os, når vi nærmer os lancering.</p>
                </div>
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-amber-100/60 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-amber-950 serif mb-4">Hvad kan du forvente?</h2>
          <p className="text-sm text-slate-500 mb-6">
            Cohéro bliver din digitale kollega – en AI-drevet platform, der bygger bro mellem teori og praksis. Gør dig klar til at:
          </p>
          <ul className="space-y-3 text-left text-sm text-slate-700 max-w-md mx-auto">
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Træne faglige færdigheder i realistiske, AI-genererede <span className="font-bold">case-spil</span>.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Få AI-feedback på dine <span className="font-bold">journalnotater</span> fra tre forskellige faglige vinkler.</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Få komplekse <span className="font-bold">juridiske paragraffer</span> forklaret pædagogisk og praksisnært.</span>
            </li>
             <li className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>Få en AI-vurdering af, om der er grundlag for at klage over en karakter med vores <span className="font-bold">Second Opinion</span>-værktøj.</span>
            </li>
          </ul>
           <div className="mt-8 pt-6 border-t border-amber-100/60">
             <h3 className="text-lg font-bold text-amber-950 serif mb-2">Hvem står bag?</h3>
             <p className="text-sm text-slate-600">Cohéro er skabt af socialrådgivere og akademikere, der brænder for at styrke din faglighed og selvtillid.</p>
           </div>
        </div>
        
      </div>
    </div>
  );
}
