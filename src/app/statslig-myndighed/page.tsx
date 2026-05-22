'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building2, 
  Gavel, 
  Scale, 
  MapPin, 
  UserCheck, 
  Info, 
  HelpCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Globe,
  Zap,
  Target,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowRight,
  Quote
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const SectionHeader = ({ icon: Icon, title, badge }: { icon: any, title: string, badge?: string }) => (
  <div className="flex flex-col mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      {badge && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50/50 px-3 py-1 rounded-full border border-indigo-100/50">
          {badge}
        </span>
      )}
    </div>
    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
  </div>
);

const InfoCard = ({ title, desc, icon: Icon, colorClass = "bg-white" }: { title: string, desc: string, icon: any, colorClass?: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`${colorClass} p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500`}
  >
    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 shadow-inner">
      <Icon className="w-7 h-7 text-indigo-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </motion.div>
);

export default function StateAuthorityEducationPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-6 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="w-12 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm shrink-0">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="p-1 bg-indigo-50 rounded-lg border border-indigo-100">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Masterclass i Forvaltning</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Eksperten: Statslig Myndighed</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
             <Link href="/concept-explainer" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                Begrebsguide
             </Link>
             <div className="w-1 h-1 bg-slate-300 rounded-full" />
             <a href="/lov-portal" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                Lovportal
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
        
        {/* NEW PRIMARY HERO: STATE ACTORS & LAWS */}
        <section className="mb-24">
           <div className="bg-white rounded-[4rem] p-10 md:p-20 text-slate-900 shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -ml-40 -mb-40" />
              
              <div className="max-w-4xl relative z-10 space-y-10 mb-20 text-center mx-auto">
                 <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-indigo-100">
                    <ShieldCheck className="w-4 h-4" /> Eksklusiv Akademisk Indsigt
                 </div>
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] text-balance">
                    Statslige Myndigheder <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 italic font-serif">& Deres Lovgivning</span>
                 </h2>
                 <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                   Som socialrådgiver i staten arbejder du med tunge retskilder. Her er det definitive overblik over hvem der styrer hvad, og hvilke love de anvender.
                 </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 relative z-10">
                 {[
                   { name: "Ankestyrelsen", role: "Behandler klager på det sociale område og beskæftigelse samt fører tilsyn.", laws: "Retssikkerhedsloven, Barnets Lov, Serviceloven, AktivSocialloven" },
                   { name: "Familieretshuset", role: "Behandler sager om skilsmisse, samvær og forældremyndighed fra barnets perspektiv.", laws: "Forældreansvarsloven, Ægteskabsloven, Børneloven" },
                   { name: "Social- og Boligstyrelsen", role: "Udvikler viden og metoder og understøtter implementering af love.", laws: "Serviceloven, Socialtilsynsloven, Barnets Lov" },
                   { name: "Kriminalforsorgen", role: "Varetager straffuldbyrdelsen i fængsler og tilsyn med dømte i frihed.", laws: "Straffuldbyrdelsesloven, Straffeloven" },
                   { name: "Politiet", role: "Forebyggelse, offerrådgivning og tværfagligt samarbejde (SSP).", laws: "Retsplejeloven, Politiloven, Straffeloven" },
                   { name: "Udbetaling Danmark", role: "Administrerer udbetaling af sociale ydelser centralt for hele landet.", laws: "Barselsloven, Pensionsloven, Boligstøtteloven" },
                   { name: "Udlændingestyrelsen / SIRI", role: "Håndterer sager om ophold, arbejde og integration af udlændinge.", laws: "Udlændingeloven, Integrationsloven" }
                 ].map((item, i) => (
                   <motion.div 
                    key={i}
                    whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                    className="p-10 bg-slate-50/50 border border-slate-100 rounded-[3rem] flex flex-col gap-8 group hover:bg-white transition-all duration-500"
                   >
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-3xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md group-hover:rotate-6">
                           <ChevronRight className="w-8 h-8" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{item.name}</h4>
                     </div>
                     <div className="space-y-6">
                        <p className="text-slate-500 font-medium leading-relaxed">{item.role}</p>
                        <div className="flex flex-wrap gap-2.5">
                           {item.laws.split(/,\s*/).map((law, idx) => (
                              <span key={idx} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl shadow-sm">
                                 {law}
                              </span>
                           ))}
                        </div>
                     </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CORE DIFFERENCES */}
        <section className="mb-32">
          <SectionHeader 
            icon={Layers} 
            title="Hvad er forskellen egentlig?" 
            badge="Grundlæggende" 
          />
          <div className="grid md:grid-cols-3 gap-8">
            <InfoCard 
              icon={Gavel}
              title="Magtens kilde"
              desc="Mens kommuner er baseret på det kommunale selvstyre, er staten den centrale magtenhed. Som socialrådgiver i staten arbejder du ofte med fortolkning af loven snarere end konkret udførelse af service."
            />
            <InfoCard 
              icon={Building2}
              title="Organisatorisk struktur"
              desc="I staten møder du Ministerier (beslutningstagere) og Styrelser (udførende enheder). Her arbejder du f.eks. i Ankestyrelsen, der fører tilsyn med kommunernes afgørelser."
            />
            <InfoCard 
              icon={Scale}
              title="Retslig overvågning"
              desc="Mange statslige stillinger som socialrådgiver handler om retslig sikring. Det er her, man sikrer, at borgernes rettigheder bliver overholdt på tværs af landet."
            />
          </div>
        </section>

        {/* WHY WORK IN THE STATE? */}
        <section className="mb-32">
          <SectionHeader 
            icon={TrendingUp} 
            title="Hvorfor vælge staten?" 
            badge="Fremtidssikret" 
          />
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div className="flex gap-8">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-center shrink-0">
                  <UserCheck className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-slate-900">Ekspertrolle</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Du bliver ofte specialist inden for et bestemt juridisk felt. For dig der elsker at nørde lovens bogstav og præcedens.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-slate-900">Langsigtet effekt</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    I styrelserne er du med til at præge nationale standarder. Din viden kan ændre forholdene for tusindvis af borgere på én gang.
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-slate-900">Politisk tæt kontakt</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Du får indsigt i hvordan dansk politik bliver til virkelighed, fra Christiansborg til den enkelte sagsbehandling.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-12 bg-indigo-50/50 rounded-[4rem] border border-indigo-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                 <Quote className="w-16 h-16 text-indigo-100" />
               </div>
               <div className="relative z-10 h-full flex flex-col justify-center gap-8">
                  <p className="text-2xl font-bold text-indigo-950 serif italic leading-relaxed">
                    "I kommunen er du socialrådgiver for den enkelte borger. I staten er du ofte socialrådgiver for selve det sociale system."
                  </p>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-full border border-indigo-100" />
                     <div>
                        <p className="font-bold text-slate-900">Mette Frederiksen (fiktiv profil)</p>
                        <p className="text-xs font-black uppercase text-indigo-600 tracking-widest">Tjek dine karrieremuligheder</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* QUICK FAQ / KEY TERMS */}
        <section className="mb-32">
           <SectionHeader 
             icon={HelpCircle} 
             title="Centrale begreber du skal kende" 
             badge="Videnstjek" 
           />
           <div className="grid md:grid-cols-2 gap-4">
              {[
                { q: "Delegation", a: "Når overordnede myndigheder (f.eks. Ministeriet) giver styrelser eller kommuner beføjelse til at træffe afgørelser." },
                { q: "Instruktionsbeføjelse", a: "Staten har ret til at give bindende ordrer til underliggende myndigheder (forskelligt fra kommunalt selvstyre)." },
                { q: "Resortansvar", a: "Hver minister har ansvaret for sit eget fagområde (f.eks. socialområdet, beskæftigelse)." },
                { q: "Ombudsmanden", a: "Fører tilsyn med hele den offentlige forvaltning (både stat og kommune), men er valgt af Folketinget." }
              ].map((faq, i) => (
                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 transition-all">
                  <h4 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    {faq.q}
                  </h4>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
           </div>
        </section>

        {/* CTA SECTION */}
        <section>
           <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_70%)]" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">Bliv master i statslig forvaltning</h2>
                 <p className="text-xl text-indigo-100 font-medium leading-relaxed">
                   Udforsk alle de statslige love og begreber i vores intelligenta værktøj.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link href="/concept-explainer" className="w-full sm:w-auto h-20 px-12 bg-white text-indigo-600 rounded-full font-black uppercase tracking-[0.2em] text-[13px] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-2xl">
                       Udforsk alle begreber <ArrowRight className="w-5 h-5 ml-4" />
                    </Link>
                    <a href="/lov-portal" className="text-[12px] font-black uppercase tracking-[0.2em] border-b-2 border-indigo-400 pb-1 hover:text-white transition-all">
                       Se Lovportalen
                    </a>
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* Footer Decoration */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-indigo-600/20">C</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Cohéro Academy</p>
           </div>
           <div className="flex items-center gap-8">
              <Link href="/portal" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Tilbage til portal</Link>
              <Link href="/faq" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Hjælp & Support</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
