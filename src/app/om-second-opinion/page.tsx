'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Scale, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  Zap,
  Lock,
  ChevronRight,
  Gavel,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/app/provider';

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function OmSecondOpinionPage() {
  const { openAuthPage } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased text-slate-900 overflow-x-hidden selection:bg-amber-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-5 sm:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08)_0%,transparent_50%)] pointer-events-none"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full mb-6 shadow-sm">
                 <Scale className="w-4 h-4 text-amber-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-amber-700">Til Studerende</span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="text-[40px] sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 text-slate-900">
                Fik du en lavere <br className="hidden sm:block" />
                karakter end fortjent?
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-lg sm:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
                Censorer er kun mennesker, og der sker desværre bedømmelsesfejl på studiet. Vores specialiserede AI analyserer din opgave og giver dig en objektiv "Second Opinion" på karakteren – så du ved, om du har en god sag, før du klager.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button onClick={() => openAuthPage('signup')} className="w-full sm:w-auto px-10 py-5 sm:py-6 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-[0.15em] text-[13px] sm:text-[14px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-3">
                    Realisér potentialet i din sag <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-6">Gratis at komme igang</p>
            </Reveal>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="py-20 sm:py-32 bg-slate-950 text-white relative px-5 sm:px-8 border-y border-amber-950/20">
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute left-[-10%] top-[20%] w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <Reveal className="space-y-6">
                   <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/30">
                       <AlertTriangle className="w-8 h-8" />
                   </div>
                   <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Lad aldrig en forkert <br className="hidden sm:block" /><span className="text-rose-400 italic">karakter</span> definere dig.</h2>
                   <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
                       Det kræver blod, sved og tårer at skrive eksamensopgaver. At modtage en bedømmelse, der føles decideret urimelig eller i direkte strid med de faglige læringsmål, kan være utrolig demotiverende og lade én føle sig magtesløs mod institutionen.
                   </p>
                   <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
                       Med <strong className="text-white">Second Opinion</strong> genskaber vi forbedringspotentialet og uvildigheden. Vores model måler krystalklart din besvarelse direkte op mod din specifikke studieordnings læringsmål og leverer uigendrivelige argumenter for opgavens (og bedømmelsens) kvaliteter.
                   </p>
                </Reveal>
                
                <Reveal delay={0.2} className="relative">
                    <div className="bg-white/5 border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 space-y-6">
                            {[
                                { title: "Opfyldelse af læringsmål", desc: "Vi krydstjekker systematisk studieordningen mod din tekst for at finde indfrielser.", icon: GraduationCap },
                                { title: "Dybdegående taksonomi", desc: "Har du ramt det forventede refleksions- og analyseniveau i din argumentation?", icon: FileText },
                                { title: "Klage-styrke", desc: "Solid juridisk og faglig risiko-vurdering til dit videre forløb, før du sender en officiel anke.", icon: Scale }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-5 items-start">
                                    <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0 text-amber-400">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-[18px]">{item.title}</h4>
                                        <p className="text-slate-400 text-[14px] mt-1 pr-4">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-20 sm:py-32 bg-white relative px-5 sm:px-8">
          <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
                  <Reveal>
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Målret din faglige klage i 3 enkle trin</h2>
                      <p className="text-lg text-slate-500 font-medium">Vi har knækket koden til at sikre, at studerende stilles lige med eksaminator - nemt, hurtigt og fuldstændig uafhængigt.</p>
                  </Reveal>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  <div className="hidden md:block absolute top-[4.5rem] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 pointer-events-none"></div>
                  
                  {[
                      { num: "01", title: "Opret en bruger", desc: "Login med din email på vores sikre platform og fortæl os, hvilket semester og studie du går på." },
                      { num: "02", title: "Upload opgave", desc: "Vi identificerer automatisk din studieordning. Upload din opgave som PDF (og evt. skriftlig feedback fra censor)." },
                      { num: "03", title: "Få Second Opinion", desc: "Analytikeren løber opgaven, karakteren og læringsmålene igennem, og afdækker eventuelle uretmæssigheder." }
                  ].map((step, i) => (
                      <Reveal key={i} delay={i * 0.1}>
                          <div className="bg-[#FDFCF8] border border-slate-100 p-8 pt-10 rounded-[2rem] text-center relative hover:shadow-xl hover:-translate-y-1 transition-all h-full group">
                              <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-8 shadow-sm group-hover:bg-amber-100 transition-colors">
                                  {step.num}
                              </div>
                              <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                              <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                          </div>
                      </Reveal>
                  ))}
              </div>
          </div>
      </section>

      {/* 4. SECURITY & TRUST */}
      <section className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8 border-t border-slate-100">
          <div className="max-w-4xl mx-auto text-center space-y-10">
              <Reveal>
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                      <Lock className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Opgaven er 100% din ejendom</h2>
                  <p className="text-lg text-slate-500 font-medium bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8 relative">
                      Dine eksamensdokumenter slettes uigenkaldeligt fra vores servere sekunder efter, analysen er fuldført. 
                      Cohéro forstår de strenge, akademiske plagiarmæssige krav og gemmer intet i opbevaring, 
                      så du kan klage helt fortroligt, uden at efterlade digitale spor af dit arbejde over for universitetet eller andre tredjeparter.
                  </p>
              </Reveal>
          </div>
      </section>

      {/* 5. CTA */}
      <section className="py-24 sm:py-32 bg-amber-500 text-center relative px-5 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0,transparent_60%)] pointer-events-none"></div>
          <Reveal className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-amber-950 tracking-tight mb-6">Få det faglige overtag.</h2>
              <p className="text-amber-900/80 text-lg sm:text-2xl font-bold mb-10 max-w-xl mx-auto text-balance">
                  Indse opgavens sande styrker, få modet til at klage og skab balance i magtforholdet.
              </p>
              <button onClick={() => openAuthPage('signup')} className="w-full sm:w-auto px-10 py-6 bg-amber-950 text-amber-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                 Tjek min opgave nu <Zap className="w-5 h-5 fill-current" />
              </button>
          </Reveal>
      </section>

    </div>
  );
}
