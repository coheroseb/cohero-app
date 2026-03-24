'use client';

import React, { useState } from 'react';
import { 
  HandHelping, 
  ArrowLeft, 
  Search, 
  MapPin,
  Loader2, 
  CheckCircle2,
  CreditCard,
  Mail,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { createAssistanceRequestAction } from '@/app/markedsplads/actions';
import { useRouter } from 'next/navigation';
import { AssistanceRequest } from '@/ai/flows/types';

const STEPS = [
  { id: 1, title: 'Hvad skal du bruge hjælp til?', description: 'Vælg kategori og giv din anmodning en overskrift.' },
  { id: 2, title: 'Fortæl os mere', description: 'Forklar din situation og hvor i landet du befinder dig.' },
  { id: 3, title: 'Dine oplysninger', description: 'Vi skal vide hvem du er, så hjælperen kan kontakte dig.' },
  { id: 4, title: 'Budget & Bekræft', description: 'Sæt din pris og send din anmodning afsted.' },
];

export default function PublicAssistanceRequestPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Rådgivning' as AssistanceRequest['category'],
    price: 300,
    location: '',
    citizenName: '',
    citizenEmail: '',
    citizenPhone: '',
  });

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createAssistanceRequestAction(formData);
      if (result.success && result.id) {
        setRequestId(result.id);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || "Der opstod en fejl.");
      }
    } catch (err) {
      console.error("Error creating request:", err);
      setError("Der opstod en fejl. Prøv venligst igen senere.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) return formData.title.length > 0 && formData.category;
    if (currentStep === 2) return formData.description.length > 20;
    if (currentStep === 3) return formData.citizenName.length > 2 && formData.citizenEmail.includes('@');
    if (currentStep === 4) return formData.price > 0;
    return false;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 pb-24">
        <div className="max-w-2xl w-full bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl p-6 sm:p-12 text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 border border-emerald-100">
           <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 text-emerald-600 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12" />
           </div>
           <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 serif">Anmodning modtaget!</h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Din anmodning er nu lagt op på markedspladsen. Du hører fra os via e-mail, når en studerende har taget opgaven.
              </p>
              
              {requestId && (
                <div className="space-y-4 py-4">
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] block w-full text-center group transition-all hover:bg-white hover:shadow-2xl hover:border-amber-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Din personlige status-side</p>
                      <p className="text-[10px] sm:text-xs text-rose-600 font-bold mb-4 sm:mb-6 break-all px-3 sm:px-4 bg-white py-3 rounded-xl border border-rose-50 select-all">
                        {typeof window !== 'undefined' && `${window.location.origin}/raadgivning/status/${requestId}`}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                        <button 
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    navigator.clipboard.writeText(`${window.location.origin}/raadgivning/status/${requestId}`);
                                    alert('Link kopieret!');
                                }
                            }}
                            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-400 py-3.5 px-8 rounded-xl hover:text-amber-950 hover:border-amber-200 transition-all active:scale-95 shadow-sm"
                        >
                            Kopiér Link
                        </button>
                        <button 
                            onClick={() => router.push(`/raadgivning/status/${requestId}`)}
                            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-[0.2em] bg-amber-950 text-white py-3.5 px-8 rounded-xl hover:bg-rose-900 transition-all active:scale-95 shadow-lg"
                        >
                            Gå til status-side
                        </button>
                      </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-left">
                     <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                     <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                        <span className="font-bold">Vigtigt:</span> Gem dette link. Vi sender det også til din mail, men det er din eneste adgang til at betale og starte opgaven senere.
                     </p>
                  </div>
                </div>
              )}
           </div>
           
           <div className="pt-4">
              <button 
                onClick={() => router.push('/')}
                className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Gå til forsiden
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-rose-100 pb-24">
      {/* Premium Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-amber-50 fixed top-0 left-0 right-0 z-50 px-6 py-4">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-amber-950 text-amber-400 rounded-xl flex items-center justify-center">
                  <HandHelping className="w-5 h-5" />
               </div>
               <div>
                  <h1 className="text-sm font-bold text-amber-950 serif">Cohéro Rådgivning</h1>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Borger portal</p>
               </div>
            </div>
            <button 
               onClick={() => router.push('/')}
               className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors"
            >
               Afbryd
            </button>
         </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 sm:pt-48 space-y-8 sm:space-y-12">
         {/* Step Progress */}
         <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 mb-1">Trin {currentStep} af 4</p>
                   <h2 className="text-xl sm:text-2xl font-bold text-slate-900 serif leading-tight">{STEPS[currentStep - 1].title}</h2>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                    {STEPS.map((s) => (
                        <div 
                            key={s.id} 
                            className={`h-1 rounded-full transition-all duration-500 ${s.id <= currentStep ? 'w-8 bg-rose-500' : 'w-2 bg-slate-200'}`} 
                        />
                    ))}
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden sm:hidden">
                <div 
                    className="h-full bg-rose-500 transition-all duration-500 ease-out" 
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                />
            </div>
         </div>

         {/* How it Works Section */}
         <div className="bg-amber-50/50 rounded-[2rem] border border-amber-100/50 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
               </div>
               <h3 className="text-sm font-black uppercase tracking-widest text-amber-900">Hvordan virker det?</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <div className="text-xl font-black text-amber-200 leading-none">01.</div>
                  <p className="text-[11px] font-bold text-amber-900/70 leading-relaxed">
                     <span className="text-amber-900">Beskriv din sag</span> – Udfyld formularen herunder og sæt et budget for opgaven.
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="text-xl font-black text-amber-200 leading-none">02.</div>
                  <p className="text-[11px] font-bold text-amber-900/70 leading-relaxed">
                     <span className="text-amber-900">Bliv matchet</span> – En socialrådgiverstuderende tager din opgave på markedspladsen.
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="text-xl font-black text-amber-200 leading-none">03.</div>
                  <p className="text-[11px] font-bold text-amber-900/70 leading-relaxed">
                     <span className="text-amber-900">Få hjælp</span> – Betal sikkert via Stripe, hvorefter I får hinandens kontaktinfo.
                  </p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-2xl shadow-amber-950/5 overflow-hidden">
            <div className="p-6 sm:p-12">
               
               <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
                  
                  {/* STEP 1: CATEGORY & TITLE */}
                  {currentStep === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hvad har du brug for?</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Rådgivning', 'Ansøgning', 'Bisidder', 'Andet'].map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({...formData, category: c as any})}
                                        className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] text-[11px] sm:text-xs font-bold transition-all border ${formData.category === c ? 'bg-amber-950 text-white border-amber-950 shadow-xl shadow-amber-950/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-amber-50'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giv din anmodning en kort overskrift</label>
                            <input 
                                type="text" 
                                placeholder="F.eks. Hjælp til anke over afslag på støtte"
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-300 text-sm sm:text-base" 
                            />
                            <p className="text-[10px] text-slate-400 font-medium px-2 italic">Gør den fængende, så de studerende hurtigt forstår opgaven.</p>
                        </div>
                    </div>
                  )}

                  {/* STEP 2: DESCRIPTION & LOCATION */}
                  {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Beskrivelse af opgaven</label>
                            <textarea 
                                placeholder="Forklar din situation og præcis hvad du håber den studerende kan hjælpe med..."
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full h-48 sm:h-64 p-6 sm:p-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-medium resize-none text-slate-900 shadow-inner leading-relaxed text-sm sm:text-base" 
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">By eller Online?</label>
                            <div className="relative">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="F.eks. Aarhus C eller Online"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    className="w-full h-14 sm:h-16 pl-12 sm:pl-14 pr-6 sm:pr-8 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-bold text-slate-900 text-sm sm:text-base" 
                                />
                            </div>
                        </div>
                    </div>
                  )}

                  {/* STEP 3: CONTACT INFORMATION */}
                  {currentStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dit fulde navn</label>
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="F.eks. Peter Jensen"
                                    required
                                    value={formData.citizenName}
                                    onChange={e => setFormData({...formData, citizenName: e.target.value})}
                                    className="w-full h-16 pl-14 pr-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-bold text-slate-900" 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail adresse</label>
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    placeholder="navn@eksempel.dk"
                                    required
                                    value={formData.citizenEmail}
                                    onChange={e => setFormData({...formData, citizenEmail: e.target.value})}
                                    className="w-full h-16 pl-14 pr-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-bold text-slate-900" 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefonnummer (valgfrit)</label>
                            <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="tel" 
                                    placeholder="+45 00 00 00 00"
                                    value={formData.citizenPhone}
                                    onChange={e => setFormData({...formData, citizenPhone: e.target.value})}
                                    className="w-full h-14 sm:h-16 pl-12 sm:pl-14 pr-6 sm:pr-8 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-bold text-slate-900 text-sm sm:text-base" 
                                />
                            </div>
                        </div>
                    </div>
                  )}

                  {/* STEP 4: BUDGET & CONFIRM */}
                  {currentStep === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        {!isConfirmed ? (
                          <>
                            <div className="space-y-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-center block">Hvor meget vil du give for hjælpen?</label>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative w-full max-w-[280px]">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">kr.</div>
                                        <input 
                                            type="number" 
                                            required
                                            value={formData.price}
                                            onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                                            className="w-full h-20 sm:h-24 pl-16 sm:pl-20 pr-6 sm:pr-8 bg-slate-50 border border-slate-100 rounded-3xl sm:rounded-[2.5rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 focus:outline-none transition-all font-black text-3xl sm:text-4xl text-slate-900 text-center" 
                                        />
                                    </div>
                                    
                                    <div className="w-full p-6 sm:p-8 bg-amber-50 rounded-3xl sm:rounded-[2.5rem] border border-amber-100 space-y-3 sm:space-y-4">
                                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-amber-900/50">
                                         <span>Platformgebyr (15%)</span>
                                         <span>-{Math.round(formData.price * 0.15)} DKK</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-amber-200">
                                         <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-tight leading-none mb-1">Hjælper modtager</span>
                                            <span className="text-[9px] text-amber-900/40 font-bold italic tracking-tighter">Attraher de bedste studerende</span>
                                         </div>
                                         <span className="text-2xl sm:text-3xl font-black text-amber-950 leading-none">
                                            {formData.price - Math.round(formData.price * 0.15)} kr.
                                         </span>
                                      </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 px-6 py-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 shadow-inner">
                               <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                               <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed">
                                  Ved at sende din anmodning accepterer du, at dine kontaktoplysninger deles med den studerende der vælger din opgave. Vi beskytter dit privatliv og sikrer, at kun verificerede studerende har adgang.
                               </p>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-8">
                             <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-4">Oversigt over din anmodning</h3>
                                <div className="space-y-4">
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Overskrift</p>
                                      <p className="font-bold text-slate-900">{formData.title}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Kategori</p>
                                      <p className="font-bold text-slate-900">{formData.category}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Budget</p>
                                      <p className="font-black text-2xl text-amber-950">{formData.price} kr.</p>
                                   </div>
                                </div>
                             </div>
                             <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 text-left">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                                   Alt ser korrekt ud. Når du trykker på bekræft, bliver din anmodning synlig for de studerende på markedspladsen.
                                </p>
                             </div>
                          </div>
                        )}
                    </div>
                  )}

                  {error && <p className="text-sm font-bold text-rose-600 text-center pt-4 animate-bounce">{error}</p>}

                  {/* NAVIGATION BUTTONS */}
                  <div className="flex items-center gap-3 sm:gap-4 pt-4">
                     {currentStep > 1 && (
                        <button 
                            type="button"
                            onClick={() => {
                                if (currentStep === 4 && isConfirmed) {
                                    setIsConfirmed(false);
                                } else {
                                    prevStep();
                                }
                            }}
                            className="h-14 sm:h-16 px-6 sm:px-8 bg-slate-50 text-slate-400 rounded-2xl sm:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border border-slate-100 hover:text-slate-900 hover:bg-white transition-all active:scale-95 flex items-center justify-center"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                     )}
                     
                     {currentStep < 4 ? (
                        <button 
                            type="button"
                            disabled={!isStepValid()}
                            onClick={nextStep}
                            className="flex-1 h-14 sm:h-16 bg-slate-900 text-white rounded-2xl sm:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-rose-900 transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            Næste trin
                            <ArrowRight className="w-4 h-4" />
                        </button>
                     ) : !isConfirmed ? (
                        <button 
                            type="button"
                            disabled={!isStepValid()}
                            onClick={() => setIsConfirmed(true)}
                            className="flex-1 h-14 sm:h-16 bg-slate-900 text-white rounded-2xl sm:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-rose-900 transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            Se oversigt
                            <ArrowRight className="w-4 h-4" />
                        </button>
                     ) : (
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !isStepValid()}
                            className="flex-1 h-16 sm:h-20 bg-emerald-600 text-white rounded-2xl sm:rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-950/20 hover:bg-emerald-700 transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-3 group"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto" /> : (
                                <>
                                    Bekræft & Send
                                    <CheckCircle2 className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </>
                            )}
                        </button>
                     )}
                  </div>

               </form>
            </div>
         </div>
         
         <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium">Brug for hjælp? Kontakt <a href="mailto:kontakt@cohero.dk" className="text-rose-400 font-bold hover:underline">kontakt@cohero.dk</a></p>
         </div>
      </main>
    </div>
  );
}
