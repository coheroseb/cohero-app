'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  useFirestore 
} from '@/firebase';
import { 
  doc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  HandHelping, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  MapPin, 
  ArrowLeft,
  Loader2,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { AssistanceRequest } from '@/ai/flows/types';
import { createStripeCheckoutForRequestAction, verifyAndMarkPaidAction } from '@/app/bistand/actions';

export default function AssistanceRequestStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const id = params?.id as string;

  const [request, setRequest] = useState<AssistanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load request data
  useEffect(() => {
    if (!firestore || !id) return;

    setIsLoading(true);
    const unsub = onSnapshot(doc(firestore, 'assistance_requests', id), (docSnap) => {
      if (docSnap.exists()) {
        setRequest({ id: docSnap.id, ...docSnap.data() } as AssistanceRequest);
        setError(null);
      } else {
        setError("Anmodningen blev ikke fundet. Dobbelttjek venligst dit ID.");
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError("Der opstod en fejl ved hentning af status.");
      setIsLoading(false);
    });

    return () => unsub();
  }, [firestore, id]);

  // Check for successful payment return or auto-pay trigger
  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    const success = searchParams?.get('success');
    const autoPay = searchParams?.get('pay') === 'true';

    if (success === 'true' && sessionId && id) {
      verifyAndMarkPaidAction(id, sessionId).then(res => {
        if (res.success) {
          router.replace(`/anmod-bistand/status/${id}`);
        }
      });
    } else if (autoPay && request && request.status === 'claimed' && !request.isPaid && !isProcessing) {
        handleStripePayment();
    }
  }, [searchParams, id, router, request, isProcessing]);

  const handleStripePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await createStripeCheckoutForRequestAction(id);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Kunne ikke oprette betaling.");
      }
    } catch (err) {
      console.error(err);
      alert("Der opstod en fejl.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-12 text-center space-y-6 border border-rose-100">
           <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
           <h2 className="text-2xl font-bold text-slate-900 serif">Ups!</h2>
           <p className="text-slate-500 font-medium">{error || "Ugyldigt link."}</p>
           <button onClick={() => router.push('/')} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Gå til forsiden</button>
        </div>
      </div>
    );
  }

  const isClaimed = request.status === 'claimed';
  const isPaid = request.isPaid;

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-rose-100 pb-24">
      {/* Premium Public Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-amber-50 fixed top-0 left-0 right-0 z-50 px-6 py-4">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-amber-950 text-amber-400 rounded-xl flex items-center justify-center">
                  <HandHelping className="w-5 h-5" />
               </div>
               <div>
                  <h1 className="text-lg font-bold text-amber-950 serif">Status for din anmodning</h1>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reference: {id}</p>
               </div>
            </div>
         </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 space-y-8">
        {/* Status Indicator Banner */}
        <section className={`p-8 rounded-[3rem] border transition-all ${
            isPaid ? 'bg-emerald-50 border-emerald-100' :
            isClaimed ? 'bg-amber-50 border-amber-100' :
            'bg-slate-50 border-slate-100'
        }`}>
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner shrink-0 ${
                    isPaid ? 'bg-emerald-100 text-emerald-600' :
                    isClaimed ? 'bg-amber-100 text-amber-600' :
                    'bg-white text-slate-400'
                }`}>
                    {isPaid ? <CheckCircle2 className="w-10 h-10" /> : isClaimed ? <Clock className="w-10 h-10 animate-pulse" /> : <Clock className="w-10 h-10" />}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 serif">
                        {isPaid ? 'Opgaven er betalt' : isClaimed ? 'En studerende har taget din opgave!' : 'Venter på en studerende'}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {isPaid ? 'Du kan nu kommunikere frit med din hjælper.' : 
                         isClaimed ? 'Gennemfør betalingen for at frigive dine kontaktoplysninger.' : 
                         'Din anmodning er synlig for alle kvalificerede studerende på platformen.'}
                    </p>
                </div>
            </div>
        </section>

        {/* Action Area: PAYMENT */}
        {isClaimed && !isPaid && (
            <section className="bg-white rounded-[3rem] border-2 border-amber-200 shadow-2xl shadow-amber-950/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 sm:p-12 space-y-8">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-amber-900" />
                        <h3 className="text-xl font-black text-amber-950 serif uppercase tracking-tight">Gennemfør Betaling</h3>
                    </div>
                    
                    <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100/50 flex flex-col items-center justify-center gap-4 text-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-2">Totalbeløb til betaling</p>
                            <p className="text-6xl font-black text-amber-950 serif">{request.price} <span className="text-2xl">kr.</span></p>
                        </div>
                        <div className="h-px bg-amber-200/50 w-full max-w-[200px]" />
                        <p className="text-xs text-amber-900/60 font-medium italic">Inkluderer platform-gebyr og udbetaling til den studerende.</p>
                    </div>

                    <button 
                        onClick={handleStripePayment}
                        disabled={isProcessing}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-rose-900 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                Betal nu via Stripe
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-4">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-400">Sikker betaling krypteret med SSL</span>
                    </div>
                </div>
            </section>
        )}

        {/* Task Details Audit */}
        <section className="bg-white rounded-[3rem] border border-amber-100 overflow-hidden shadow-sm">
            <div className="p-8 md:p-12 space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Oversigt</p>
                        <h3 className="text-2xl font-bold text-slate-900 serif">{request.title}</h3>
                    </div>
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">{request.category}</span>
                </div>

                <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{request.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Lokation</p>
                            <p className="text-sm font-bold text-slate-700">{request.location}</p>
                        </div>
                    </div>
                    {isClaimed && isPaid && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Hjælper</p>
                                <p className="text-sm font-bold text-emerald-700">{request.studentName || 'Din Hjælper'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* Help / Footer */}
        <div className="text-center space-y-4 px-12">
            <p className="text-xs text-slate-400 leading-relaxed">
                Har du spørgsmål til din anmodning? Kontakt Cohéro support på support@cohero.dk og oplys dit reference-id: <span className="font-mono">{id}</span>
            </p>
            <button onClick={() => router.push('/')} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 transition-colors">Gå tilbage til Cohéro</button>
        </div>
      </main>
    </div>
  );
}
