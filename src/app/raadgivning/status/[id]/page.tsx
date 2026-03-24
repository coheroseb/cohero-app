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
  AlertCircle,
  Star,
  Mail,
  Phone
} from 'lucide-react';
import { AssistanceRequest } from '@/ai/flows/types';
import { createStripeCheckoutForRequestAction, verifyAndMarkPaidAction, completeAssistanceRequestAction } from '@/app/markedsplads/actions';

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
  const [userRating, setUserRating] = useState(5);

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
          router.replace(`/raadgivning/status/${id}`);
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
  
  const handleComplete = async () => {
    if (isProcessing) return;
    if (!confirm("Vil du markere opgaven som udført? Dette bekræfter over for Cohéro, at du har modtaget hjælpen.")) return;
    
    setIsProcessing(true);
    try {
      const result = await completeAssistanceRequestAction(id, userRating);
      if (result.success) {
        // Firebase onSnapshot will handle the state update automatically
      } else {
        alert(result.error || "Kunne ikke gennemføre handlingen.");
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
  const isCompleted = request.status === 'completed';

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 space-y-6 sm:space-y-8">
        {/* Status Indicator Banner */}
        <section className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border transition-all ${
            isCompleted ? 'bg-emerald-100 border-emerald-200' :
            isPaid ? 'bg-emerald-50 border-emerald-100' :
            isClaimed ? 'bg-amber-50 border-amber-100' :
            'bg-slate-50 border-slate-100'
        }`}>
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-inner shrink-0 ${
                    isCompleted ? 'bg-emerald-200 text-emerald-700' :
                    isPaid ? 'bg-emerald-100 text-emerald-600' :
                    isClaimed ? 'bg-amber-100 text-amber-600' :
                    'bg-white text-slate-400'
                }`}>
                    {isCompleted ? <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10" /> : isPaid ? <CheckCircle2 className="w-7 h-7 sm:w-10 sm:h-10" /> : isClaimed ? <Clock className="w-7 h-7 sm:w-10 sm:h-10 animate-pulse" /> : <Clock className="w-7 h-7 sm:w-10 sm:h-10" />}
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 serif leading-tight">
                        {isCompleted ? 'Opgaven er afsluttet' : isPaid ? 'Opgaven er betalt' : isClaimed ? 'En studerende har taget din opgave!' : 'Venter på en studerende'}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {isCompleted ? `Tak fordi du brugte Cohéro. Du gav din hjælper ${request.rating || userRating} stjerner.` :
                         isPaid ? 'Du kan nu kommunikere frit med din hjælper.' : 
                         isClaimed ? 'Gennemfør betalingen for at frigive dine kontaktoplysninger.' : 
                         'Din anmodning er synlig for alle kvalificerede studerende på platformen.'}
                    </p>
                </div>
            </div>
        </section>

        {/* Action Area: COMPLETION */}
        {isClaimed && isPaid && !isCompleted && (
            <section className="bg-white rounded-[2rem] sm:rounded-[3rem] border-2 border-emerald-200 shadow-2xl shadow-emerald-950/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 sm:p-12 space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-900" />
                        <h3 className="text-lg sm:text-xl font-black text-emerald-950 serif uppercase tracking-tight">Afslut opgaven</h3>
                    </div>
                    
                    <p className="text-slate-600 font-medium leading-relaxed">
                        Når du har modtaget hjælpen fra <strong>{request.studentName || 'den studerende'}</strong>, skal du markere opgaven som udført. Bedøm også gerne oplevelsen herunder.
                    </p>

                    <div className="flex flex-col items-center gap-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giv en bedømmelse</p>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setUserRating(star)}
                                    className="p-1 transition-all active:scale-90"
                                >
                                    <Star 
                                        className={`w-8 h-8 sm:w-10 sm:h-10 ${
                                            star <= userRating 
                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                                            : 'text-slate-200'
                                        } transition-all duration-300`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleComplete}
                        disabled={isProcessing}
                        className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                Marker som udført
                                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </section>
        )}

        {/* Action Area: PAYMENT */}
        {isClaimed && !isPaid && !isCompleted && (
            <section className="bg-white rounded-[2rem] sm:rounded-[3rem] border-2 border-amber-200 shadow-2xl shadow-amber-950/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 sm:p-12 space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-amber-900" />
                        <h3 className="text-lg sm:text-xl font-black text-amber-950 serif uppercase tracking-tight">Gennemfør Betaling</h3>
                    </div>
                    
                    <div className="p-6 sm:p-8 bg-amber-50/50 rounded-[1.5rem] sm:rounded-[2.5rem] border border-amber-100/50 flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-2">Totalbeløb til betaling</p>
                            <p className="text-4xl sm:text-6xl font-black text-amber-950 serif">{request.price} <span className="text-xl sm:text-2xl">kr.</span></p>
                        </div>
                        <div className="h-px bg-amber-200/50 w-full max-w-[150px] sm:max-w-[200px]" />
                        <p className="text-[10px] sm:text-xs text-amber-900/60 font-medium italic">Inkluderer platform-gebyr og udbetaling til den studerende.</p>
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
        <section className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-amber-100 overflow-hidden shadow-sm">
            <div className="p-6 sm:p-12 space-y-6 sm:space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Oversigt</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 serif leading-tight">{request.title}</h3>
                    </div>
                    <span className="px-3 sm:px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{request.category}</span>
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
                        <div className="flex flex-col gap-6 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Din Hjælper</p>
                                    <p className="text-sm font-bold text-emerald-700">{request.studentName || 'Studerende'}</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {request.studentPhone && (
                                    <a href={`tel:${request.studentPhone}`} className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-all group/contact">
                                        <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover/contact:scale-110 transition-transform">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">Telefon</p>
                                            <p className="text-sm font-bold text-emerald-900">{request.studentPhone}</p>
                                        </div>
                                    </a>
                                )}
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                        Din hjælper kontakter dig senest 24 timer efter betaling. Du kan også selv ringe nu.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* Help / Footer */}
        <div className="text-center space-y-4 px-12">
            <p className="text-xs text-slate-400 leading-relaxed">
                Har du spørgsmål til din anmodning? Kontakt Cohéro support på kontakt@cohero.dk og oplys dit reference-id: <span className="font-mono">{id}</span>
            </p>
            <button onClick={() => router.push('/')} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 transition-colors">Gå tilbage til Cohéro</button>
        </div>
      </main>
    </div>
  );
}
