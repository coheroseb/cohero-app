'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Mail, 
  Sparkles, 
  FileText, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Calculator,
  MessageSquare,
  Award,
  BookOpen,
  X,
  Loader2,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { sendProofreadingQuoteRequestAction } from '@/app/actions';

export default function KorrekturPage() {
  const [charCount, setCharCount] = useState(24000);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '', deadline: '' });
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const PRICE_PER_PAGE = 25;
  const CHARS_PER_PAGE = 2400;

  const pageCount = useMemo(() => Math.ceil(charCount / CHARS_PER_PAGE), [charCount]);
  const totalPrice = useMemo(() => pageCount * PRICE_PER_PAGE, [pageCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const result = await sendProofreadingQuoteRequestAction({
        ...formData,
        charCount,
        estimatedPrice: totalPrice
      });
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const features = [
    {
      title: "Akademisk Præcision",
      desc: "Vi går i dybden med dit sprog, tegnsætning og den røde tråd i din opgave.",
      icon: Award,
      color: "text-amber-600 bg-amber-50"
    },
    {
      title: "Hurtig Levering",
      desc: "Vi ved, at deadlines er vigtige. Vi leverer altid til tiden, så du kan nå at uploade.",
      icon: Clock,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Specialiseret i Velfærd",
      desc: "Som eksperter i socialrådgiver- og pædagogstudiet forstår vi de faglige termer.",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 selection:bg-amber-200 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-amber-100 rounded-full text-amber-950 text-xs font-black uppercase tracking-widest mb-8 shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          Professionel Korrektur
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 serif tracking-tighter leading-tight mb-8"
        >
          Giv din opgave den <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-950 to-amber-800">finpudsning</span> den fortjener
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-12"
        >
          Sikr din faglige formidling med knivskarp korrekturlæsning. Vi fjerner sprogbøf og sikrer, at din sensor fokuserer på dit indhold – ikke dine kommaer.
        </motion.p>
      </section>

      {/* Pricing Calculator */}
      <section className="relative px-6 pb-32 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-3xl p-8 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Calculator className="w-40 h-40" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 serif mb-6">Hvor stor er din opgave?</h2>
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Antal tegn (inkl. mellemrum)</label>
                      <span className="text-xl font-black text-amber-950">{hasMounted ? charCount.toLocaleString('da-DK') : charCount}</span>
                    </div>
                    <input 
                      type="range" 
                      min="2400" 
                      max="240000" 
                      step="100" 
                      value={charCount}
                      onChange={(e) => setCharCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-900"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-black uppercase text-slate-400">
                      <span>1 Side</span>
                      <span>100 Sider</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Anslået antal sider</p>
                      <p className="text-2xl font-black text-slate-900">{pageCount}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black uppercase text-amber-700 mb-1">Pris pr. side</p>
                      <p className="text-2xl font-black text-amber-900">25 kr.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 md:p-12 rounded-[2rem] text-white flex flex-col justify-between min-h-[300px] shadow-xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Dit prisoverslag</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black">
                      {hasMounted ? totalPrice.toLocaleString('da-DK') : totalPrice}
                    </span>
                    <span className="text-xl font-bold text-slate-400">DKK</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4 leading-relaxed font-medium">Inklusive gennemgang af ortografi, tegnsætning og sproglig flow.</p>
                </div>

                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="mt-8 w-full py-5 bg-white text-slate-900 text-center rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
                >
                  Få et præcist tilbud
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Checklist Section */}
      <section className="px-6 py-32 z-10 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 serif tracking-tight mb-8">Hvad vi gennemgår <br/><span className="text-amber-600">i hver eneste opgave</span></h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
                Vi læser ikke bare din opgave – vi gennemanalyserer den. Her er den komplette liste over, hvad vi sikrer os er i topform, før vi sender den tilbage til dig.
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Stavning & Tegnsætning", desc: "Slut med dumme slåfejl og glemte kommaer." },
                  { title: "Sætningskonstruktion", desc: "Vi sikrer, at dit sprog flyder og er letlæseligt." },
                  { title: "Akademisk Niveau", desc: "Vi løfter din tekst fra hverdagssprog til professionel stil." },
                  { title: "Den Røde Tråd", desc: "Vi tjekker den logiske sammenhæng i din argumentation." },
                  { title: "Kildehenvisninger", desc: "Sikring af korrekt format (APA, Harvard m.m.)." },
                  { title: "Layout & Struktur", desc: "Tjek af overskrifter, sidetal og indholdsfortegnelse." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white transition-colors group"
                  >
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-blue-200 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-white/40 backdrop-blur-3xl p-2 rounded-[3.5rem] border border-white/60 shadow-2xl">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <FileText className="w-40 h-40" />
                   </div>
                   <div className="relative z-10">
                      <div className="w-12 h-12 bg-amber-400 text-amber-950 rounded-2xl flex items-center justify-center mb-8">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-black serif mb-6">Vores Kvalitetsgaranti</h3>
                      <p className="text-slate-400 font-medium leading-relaxed mb-8">
                        Vi benytter os af højtuddannede læsere med erfaring fra netop dit fagområde. Du får trackede ændringer, så du selv kan se hver eneste rettelse, vi har foretaget.
                      </p>
                      <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm font-bold text-amber-400">
                          <CheckCircle2 className="w-4 h-4" />
                          100% Fortrolighed
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-amber-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Fokus på Professionsfagene
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-amber-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Mulighed for ekspres-levering
                        </li>
                      </ul>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-6 py-32 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 serif tracking-tight mb-4">Eksperterne bag din rettelse</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Din opgave bliver læst af fagpersoner med dyb indsigt i den akademiske verden og velfærdsområdet.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-3xl mx-auto mb-6 flex items-center justify-center text-amber-900 text-3xl font-black group-hover:rotate-6 transition-transform">
                SH
              </div>
              <h3 className="text-2xl font-black text-slate-900 serif mb-2">Sebastian Hansen</h3>
              <p className="text-amber-700 text-xs font-black uppercase tracking-widest mb-4">Uddannet Socialrådgiver</p>
              <p className="text-slate-500 font-medium leading-relaxed">
                Kandidatstuderende i Arbejdsliv ved Roskilde Universitet.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl mx-auto mb-6 flex items-center justify-center text-blue-900 text-3xl font-black group-hover:-rotate-6 transition-transform">
                JH
              </div>
              <h3 className="text-2xl font-black text-slate-900 serif mb-2">Julie Lee Hansen</h3>
              <p className="text-blue-700 text-xs font-black uppercase tracking-widest mb-4">Bachelor i uddannelsesvidenskab</p>
              <p className="text-slate-500 font-medium leading-relaxed">
                Kandidatstuderende i Arbejdsliv ved Roskilde Universitet.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 py-32 z-10 relative">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-950 to-slate-950 p-12 md:p-20 rounded-[3.5rem] text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full animate-ping" />
            <div className="absolute bottom-20 right-20 w-40 h-40 border-2 border-amber-400 rounded-full opacity-20" />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black serif tracking-tight mb-8">Klar til at løfte din opgave?</h2>
            <p className="text-amber-100/70 font-medium text-lg mb-12 max-w-lg mx-auto leading-relaxed">
              Vi vender hurtigt tilbage med en pris og en tidsplan.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-3 px-8 py-5 bg-amber-400 text-amber-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-400/20 hover:scale-110 active:scale-95 transition-all"
              >
                <Mail className="w-5 h-5" />
                Få et tilbud nu
              </button>
              <div className="flex items-center gap-2 text-amber-100/50 text-xs font-black uppercase tracking-[0.2em]">
                <ShieldCheck className="w-4 h-4" />
                Sikker håndtering af data
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quote Request Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 serif">Anmod om tilbud</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Vi kontakter dig lynhurtigt.</p>
                  </div>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {status === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 serif mb-2">Forespørgsel sendt!</h4>
                    <p className="text-slate-500 font-medium mb-8">Tak for din interesse. Vi har modtaget din anmodning om korrektur til d. {formData.deadline ? new Date(formData.deadline).toLocaleDateString('da-DK') : 'snarest'}. Vi vender tilbage hurtigst muligt.</p>
                    <button 
                      onClick={() => setIsFormOpen(false)}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Luk vindue
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black uppercase text-amber-700 mb-1">Valgt omfang</p>
                        <p className="text-lg font-black text-amber-900">{hasMounted ? charCount.toLocaleString('da-DK') : charCount} tegn</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Estimeret pris</p>
                        <p className="text-lg font-black text-slate-900">{hasMounted ? totalPrice.toLocaleString('da-DK') : totalPrice} kr.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Dit Navn</label>
                        <input 
                          required
                          type="text" 
                          placeholder="F.eks. Mette Jensen"
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Din Email</label>
                        <input 
                          required
                          type="email" 
                          placeholder="din@email.dk"
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Ønsket Deadline</label>
                        <input 
                          required
                          type="date" 
                          className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Eventuel besked</label>
                        <textarea 
                          placeholder="Har du specielle ønsker eller en stram deadline?"
                          className="w-full h-32 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={status === 'sending'}
                      type="submit"
                      className="w-full h-16 bg-amber-400 text-amber-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {status === 'sending' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Forespørgsel
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Copyright */}
      <footer className="px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} Cohéro I/S • Pris: 25 kr. pr. 2.400 tegn
      </footer>
    </div>
  );
}
