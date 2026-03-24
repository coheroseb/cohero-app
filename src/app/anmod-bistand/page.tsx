
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
  AlertCircle
} from 'lucide-react';
import { createAssistanceRequestAction } from '@/app/bistand/actions';
import { useRouter } from 'next/navigation';
import { AssistanceRequest } from '@/ai/flows/types';

export default function PublicAssistanceRequestPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 pb-24">
        <div className="max-w-2xl w-full bg-white rounded-[3.5rem] shadow-2xl p-12 text-center space-y-8 animate-fade-in-up border border-emerald-100">
           <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
           </div>
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-900 serif">Anmodning modtaget!</h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Din anmodning er nu lagt op på markedspladsen. Du hører fra os via e-mail, når en studerende har taget opgaven.
              </p>
              
              {requestId && (
                <div className="space-y-4 py-4">
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] block w-full text-center group transition-all hover:bg-white hover:shadow-2xl hover:border-amber-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Din personlige status-side</p>
                      <p className="text-xs text-rose-600 font-bold mb-6 break-all px-4 bg-white py-3 rounded-xl border border-rose-50 select-all">
                        {typeof window !== 'undefined' && `${window.location.origin}/anmod-bistand/status/${requestId}`}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                        <button 
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    navigator.clipboard.writeText(`${window.location.origin}/anmod-bistand/status/${requestId}`);
                                    alert('Link kopieret!');
                                }
                            }}
                            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-400 py-3.5 px-8 rounded-xl hover:text-amber-950 hover:border-amber-200 transition-all active:scale-95 shadow-sm"
                        >
                            Kopiér Link
                        </button>
                        <button 
                            onClick={() => router.push(`/anmod-bistand/status/${requestId}`)}
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
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-rose-100">
      {/* Premium Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-amber-50 fixed top-0 left-0 right-0 z-50 px-6 py-4">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-2xl flex items-center justify-center">
                  <HandHelping className="w-6 h-6" />
               </div>
               <div>
                  <h1 className="text-xl font-bold text-amber-950 serif">Cohéro Bistand</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Borger-forbindelse</p>
               </div>
            </div>
            <button 
               onClick={() => router.push('/')}
               className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
            >
               Tilbage til forsiden
            </button>
         </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
         <div className="mb-12 text-center sm:text-left">
            <h2 className="text-4xl sm:text-5xl font-black text-amber-950 serif leading-tight">Få hjælp af en <br /><span className="text-rose-600">fagkyndig studerende.</span></h2>
            <p className="text-slate-500 text-lg mt-6 font-medium leading-relaxed max-w-2xl">
               Her kan du som almindelig borger anmode om hjælp til sociale sager, ansøgninger eller bisiddelse. Vores dygtige studerende står klar til at hjælpe.
            </p>
         </div>

         <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-amber-100 shadow-xl shadow-amber-900/5 overflow-hidden">
            <div className="p-8 sm:p-12 space-y-10">
               
               {/* Contact Person */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-black text-xs">1</span>
                     <h3 className="text-lg font-bold text-slate-900">Dine oplysninger</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dit Navn</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              placeholder="F.eks. Peter Jensen"
                              required
                              value={formData.citizenName}
                              onChange={e => setFormData({...formData, citizenName: e.target.value})}
                              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium" 
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Din E-mail</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="email" 
                              placeholder="navn@eksempel.dk"
                              required
                              value={formData.citizenEmail}
                              onChange={e => setFormData({...formData, citizenEmail: e.target.value})}
                              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium" 
                           />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefonnummer (valgfrit)</label>
                      <div className="relative">
                         <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="tel" 
                            placeholder="+45 00 00 00 00"
                            value={formData.citizenPhone}
                            onChange={e => setFormData({...formData, citizenPhone: e.target.value})}
                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium" 
                         />
                      </div>
                   </div>
               </section>

               <div className="h-px bg-amber-50 w-full" />

               {/* Task Details */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center font-black text-xs">2</span>
                     <h3 className="text-lg font-bold text-slate-900">Opgavens detaljer</h3>
                  </div>
                  
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hvad skal du have hjælp til?</label>
                     <div className="flex flex-wrap gap-2">
                        {['Rådgivning', 'Ansøgning', 'Bisidder', 'Andet'].map(c => (
                           <button 
                              key={c}
                              type="button"
                              onClick={() => setFormData({...formData, category: c as any})}
                              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${formData.category === c ? 'bg-amber-950 text-white shadow-lg shadow-amber-900/20' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-amber-50'}`}
                           >
                              {c}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Overskrift</label>
                     <input 
                        type="text" 
                        placeholder="F.eks. Hjælp til anke over afslag på støtte"
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium" 
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Beskrivelse</label>
                     <textarea 
                        placeholder="Forklar din situation og præcis hvad du håber den studerende kan hjælpe med..."
                        required
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium resize-none shadow-inner" 
                     />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Budget (DKK)</label>
                        <div className="relative">
                           <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="number" 
                              required
                              value={formData.price}
                              onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-bold" 
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">By eller Online</label>
                        <div className="relative">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              placeholder="F.eks. Aarhus C eller Online"
                              value={formData.location}
                              onChange={e => setFormData({...formData, location: e.target.value})}
                              className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-medium" 
                           />
                        </div>
                     </div>
                  </div>
               </section>

               <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-amber-900/50">
                     <span>Platformgebyr (15%)</span>
                     <span>-{Math.round(formData.price * 0.15)} DKK</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-amber-200">
                     <div className="flex flex-col">
                        <span className="text-base font-black text-amber-950">Den studerende modtager</span>
                        <span className="text-[10px] text-amber-900/60 font-medium italic">Hjælper med at tiltrække de bedste studerende</span>
                     </div>
                     <span className="text-2xl font-black text-amber-950 leading-none">
                        {formData.price - Math.round(formData.price * 0.15)} DKK
                     </span>
                  </div>
               </div>

               {error && <p className="text-sm font-bold text-rose-600 text-center">{error}</p>}

               <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.15em] text-sm shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98] group"
               >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                     <span className="flex items-center justify-center gap-2">
                        Send anmodning <CheckCircle2 className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                     </span>
                  )}
               </button>

               <div className="flex items-start gap-4 px-4 py-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                  <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed">
                     Dine oplysninger bliver kun delt med den studerende der vælger at tage opgaven. Betaling foregår efter aftale med den studerende. Platformen sikrer forbindelsen og kvaliteten af de studerende.
                  </p>
               </div>
            </div>
         </form>
      </main>
    </div>
  );
}
