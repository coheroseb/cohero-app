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

  const PRICE_PER_PAGE = 59;
  const CHARS_PER_PAGE = 2400;
  const SMALL_ORDER_FEE = 75;
  const SMALL_ORDER_THRESHOLD = 10;

  const pageCount = useMemo(() => Math.ceil(charCount / CHARS_PER_PAGE), [charCount]);
  const isSmallOrder = useMemo(() => pageCount < SMALL_ORDER_THRESHOLD, [pageCount]);
  const totalPrice = useMemo(() => (pageCount * PRICE_PER_PAGE) + (isSmallOrder ? SMALL_ORDER_FEE : 0), [pageCount, isSmallOrder]);

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

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      {/* Architectural Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-[100px] font-black text-slate-950 serif tracking-tighter leading-[0.85] mb-12"
        >
          Giv din opgave <br />
          <span className="text-indigo-600 italic">akademisk</span> tyngde.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-16"
        >
          Sikr din faglige formidling med knivskarp korrekturlæsning. Vi sikrer, at din sensor fokuserer på dit indhold – ikke dine kommaer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm text-slate-600 font-medium"
        >
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-[11px] font-black text-indigo-700">S</div>
            <div className="w-8 h-8 rounded-full bg-violet-200 border-2 border-white flex items-center justify-center text-[11px] font-black text-violet-700">J</div>
          </div>
          <span>
            <span className="font-black text-slate-900">Sebastian & Julie</span> læser kandidat i Arbejdsliv ved Roskilde Universitet
          </span>
        </motion.div>
      </section>

      {/* Pricing Calculator */}
      <section className="relative px-6 pb-40 z-10">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[4rem] p-12 md:p-20 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.05)] relative overflow-hidden"
          >
            <div className="grid lg:grid-cols-2 gap-20 items-start">
              <div className="space-y-12">
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 serif tracking-tight">Prisberegner</h2>
                    <p className="text-slate-500 font-medium">Indtast omfanget af din opgave for at se din pris.</p>
                </div>
                
                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Antal tegn (inkl. mellemrum)</label>
                      <span className="text-3xl font-black text-slate-950 tabular-nums">
                        {hasMounted ? charCount.toLocaleString('da-DK') : charCount}
                      </span>
                    </div>
                    <div className="relative pt-4">
                        <input 
                        type="range" 
                        min="2400" 
                        max="240000" 
                        step="100" 
                        value={charCount}
                        onChange={(e) => setCharCount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-950"
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <span>1 Side</span>
                      <span>100 Sider</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anslået sider</p>
                      <p className="text-4xl font-black text-slate-950">{pageCount}</p>
                    </div>
                    <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Pris pr. side</p>
                      <p className="text-4xl font-black text-indigo-600">59 <span className="text-sm">kr.</span></p>
                    </div>
                    <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Lille-ordre tillæg</p>
                      <p className="text-4xl font-black text-amber-700">{isSmallOrder ? <>75 <span className="text-sm">kr.</span></> : <span className="text-2xl text-slate-300">–</span>}</p>
                      <p className="text-[9px] text-slate-400">Gælder ved under 10 sider</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-950/20 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                        <Calculator className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Dit prisoverslag</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-7xl font-black tabular-nums tracking-tighter">
                                {hasMounted ? totalPrice.toLocaleString('da-DK') : totalPrice}
                                </span>
                                <span className="text-xl font-bold text-slate-500 uppercase">kr.</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic">
                              {isSmallOrder ? 'Inkl. 75 kr. tillæg for under 10 sider' : '59 kr. pr. normalside'}
                            </p>
                        </div>
                        
                        <div className="h-px w-full bg-white/10" />
                        
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            Altid inklusiv fuld gennemgang af ortografi, tegnsætning og det akademiske flow.
                        </p>

                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 group transition-all hover:-translate-y-1"
                        >
                            Bestil Korrektur
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                   <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Hurtig levering
                   </span>
                   <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Fortrolighed
                   </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Checklist Section */}
      <section className="px-6 py-40 z-10 relative bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                 <h2 className="text-5xl md:text-7xl font-black text-slate-950 serif tracking-tighter leading-none">
                    Hvad vi <br /> <span className="text-indigo-600 italic">faktisk</span> gør.
                 </h2>
                 <p className="text-slate-500 font-medium leading-relaxed text-xl max-w-lg">
                    Vi læser ikke bare din opgave – vi gennemanalyserer den for at sikre, at dit faglige budskab står stærkt.
                 </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {[
                  { title: "Stavning & Tegnsætning", desc: "Slut med slåfejl og glemte kommaer." },
                  { title: "Sætningskonstruktion", desc: "Vi sikrer, at dit sprog flyder og er letlæseligt." },
                  { title: "Akademisk Niveau", desc: "Vi løfter din tekst fra hverdagssprog til professionel stil." },
                  { title: "Den Røde Tråd", desc: "Vi tjekker den logiske sammenhæng i din argumentation." },
                  { title: "Kildehenvisninger", desc: "Sikring af korrekt format (APA, Harvard m.m.)." },
                  { title: "Teori & Videnskabsteori", desc: "Vi sikrer korrekt anvendelse og formidling af teorier og videnskabsteoretiske positioner." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-6 p-6 rounded-[2rem] hover:bg-white transition-all group"
                  >
                    <div className="mt-1 w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-950 text-lg">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px] rounded-full" />
              <div className="relative bg-white border border-slate-100 rounded-[4rem] p-12 md:p-16 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.05)] space-y-12">
                    <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center shadow-2xl">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-6">
                        <h3 className="text-3xl font-black text-slate-950 serif">Kvalitetsgaranti</h3>
                        <p className="text-slate-500 font-medium leading-relaxed text-lg">
                            Vi benytter os af højtuddannede læsere med erfaring fra netop dit fagområde. Du får trackede ændringer, så du selv kan se hver eneste rettelse.
                        </p>
                    </div>

                    <div className="pt-8 space-y-6">
                        <div className="h-px w-full bg-slate-100" />
                        <div className="flex flex-wrap gap-4">
                           <span className="px-5 py-2.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">Specialiseret i Velfærd</span>
                           <span className="px-5 py-2.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">Hurtig Levering</span>
                           <span className="px-5 py-2.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100">Fuld Fortrolighed</span>
                        </div>
                    </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-6 py-40 z-10 relative">
        <div className="max-w-[1000px] mx-auto text-center space-y-24">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-slate-950 serif tracking-tighter">Eksperterne bag.</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg">Din opgave bliver læst af fagpersoner med dyb indsigt i den akademiske verden.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] transition-all text-center space-y-8"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center text-slate-300 text-3xl font-black group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                SH
              </div>
              <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-950 serif">Sebastian Hansen</h3>
                  <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Socialrådgiver & Founder</p>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Uddannet socialrådgiver fra sommeren 2025. Sebastian har topkarakterer fra sin uddannelse, herunder et 12-tal i sit bachelorprojekt.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] transition-all text-center space-y-8"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center text-slate-300 text-3xl font-black group-hover:bg-slate-950 group-hover:text-white transition-all duration-500">
                JH
              </div>
              <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-950 serif">Julie Lee Hansen</h3>
                  <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Uddannelsesvidenskab & Founder</p>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Bachelor i uddannelsesvidenskab og kandidatstuderende i Arbejdsliv ved Roskilde Universitet.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 py-40 z-10 relative">
        <div className="max-w-[1200px] mx-auto bg-slate-950 p-16 md:p-32 rounded-[4.5rem] text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 space-y-12"
          >
            <div className="space-y-6">
                <h2 className="text-5xl md:text-8xl font-black serif tracking-tighter leading-[0.85]">Få din opgave <br /> <span className="italic text-indigo-400">tjekket</span> nu.</h2>
                <p className="text-slate-400 font-medium text-xl max-w-lg mx-auto leading-relaxed">
                Vi vender tilbage med et uforpligtende tilbud inden for få timer.
                </p>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-8">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-4 px-12 py-6 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-white/10 hover:-translate-y-1 transition-all"
              >
                <Mail className="w-5 h-5" />
                Indsend forespørgsel
              </button>
              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 md:p-16">
                <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-950 serif tracking-tight">Anmod om tilbud</h3>
                    <p className="text-slate-500 font-medium">Udfyld formularen, så kontakter vi dig hurtigst muligt.</p>
                  </div>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {status === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center space-y-8"
                  >
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-3xl font-black text-slate-950 serif">Forespørgsel sendt!</h4>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">Tak for din tillid. Vi kontakter dig på mail lynhurtigt med et uforpligtende tilbud.</p>
                    </div>
                    <button 
                      onClick={() => setIsFormOpen(false)}
                      className="px-12 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                    >
                      Luk vindue
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valgt omfang</p>
                        <p className="text-xl font-black text-slate-950 tabular-nums">{hasMounted ? charCount.toLocaleString('da-DK') : charCount} tegn</p>
                      </div>
                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Estimeret pris</p>
                        <p className="text-xl font-black text-slate-950 tabular-nums">{hasMounted ? totalPrice.toLocaleString('da-DK') : totalPrice} kr.</p>
                        <p className="text-[9px] text-slate-400 font-medium italic">{isSmallOrder ? 'Inkl. 75 kr. tillæg for under 10 sider' : '59 kr. pr. normalside'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Dit Navn</label>
                            <input 
                            required
                            type="text" 
                            placeholder="F.eks. Mette Jensen"
                            className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-3xl text-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Din Email</label>
                            <input 
                            required
                            type="email" 
                            placeholder="din@email.dk"
                            className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-3xl text-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Ønsket Deadline</label>
                        <input 
                          required
                          type="date" 
                          className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-3xl text-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Evt. besked</label>
                        <textarea 
                          placeholder="Har du specielle ønsker eller en stram deadline?"
                          className="w-full h-32 px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300"
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={status === 'sending'}
                      type="submit"
                      className="w-full h-20 bg-slate-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                      {status === 'sending' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
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
      <footer className="px-6 py-20 text-center border-t border-slate-50">
        <div className="flex flex-col items-center gap-6">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
                © {new Date().getFullYear()} Cohéro I/S • Pris: 59 kr. pr. 2.400 tegn • Tillæg på 75 kr. for opgaver under 10 sider
            </p>
            <div className="flex gap-8 opacity-20 grayscale">
               <ShieldCheck className="w-5 h-5" />
               <CheckCircle2 className="w-5 h-5" />
               <Award className="w-5 h-5" />
            </div>
        </div>
      </footer>

      <style jsx>{`
        .serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
}
