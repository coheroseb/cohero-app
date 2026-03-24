'use client';

import React from 'react';
import { Sparkles, Brain, ArrowRight, Star, Users, Heart, Zap, Compass, Quote, Baby, ShieldCheck, BookMarked } from 'lucide-react';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PedagogueLandingContentProps {
  onStart: () => void;
}

const FloatingElement: React.FC<{ className: string; delay: string }> = ({ className, delay }) => (
  <div 
    style={{ animationDelay: delay }}
    className={`absolute w-2 h-2 bg-amber-900/5 rounded-full blur-[2px] animate-float ${className}`}
  />
);

const PedagogueLandingContent: React.FC<PedagogueLandingContentProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col overflow-hidden relative">
      
      {/* Atmosfæriske detaljer */}
      <FloatingElement className="top-1/4 left-10" delay="0.5s" />
      <FloatingElement className="top-1/3 right-20" delay="1.2s" />
      <FloatingElement className="bottom-1/4 left-1/2" delay="2.5s" />
      
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[90vw] bg-emerald-50/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-10">
            <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-amber-950/5 shadow-sm">
              <Baby size={14} className="text-emerald-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Den pædagogiske dannelsesrejse</span>
            </div>
            
            <h1 className="animate-ink text-6xl md:text-8xl font-bold text-amber-950 serif leading-[0.9] tracking-tighter">
              Fra teori til <span className="text-emerald-800 italic relative">
                nærvær
                <svg className="absolute -bottom-4 left-0 w-full h-4 text-emerald-300/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" className="animate-draw" />
                </svg>
              </span> i den pædagogiske praksis.
            </h1>
            
            <p className="reveal delay-1 text-xl md:text-2xl text-slate-600/80 max-w-xl leading-relaxed font-medium">
              Cohéro hjælper pædagogstuderende med at mestre koblingen mellem udviklingspsykologi, inklusion og hverdagens etiske dilemmaer.
            </p>
            
            <div className="reveal delay-2 flex flex-col sm:flex-row items-center gap-8 pt-4">
              <button 
                onClick={onStart}
                className="group relative px-12 py-6 bg-amber-950 text-white rounded-2xl text-xl font-bold transition-all hover:bg-emerald-950 hover:shadow-2xl hover:scale-105 active:scale-95 w-full sm:w-auto overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start din dannelse
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              
              <div className="flex flex-col gap-1">
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-500 fill-amber-500" />)}
                 </div>
                 <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Studerende fra landets pædagoguddannelser</p>
              </div>
            </div>
          </div>

          {/* Visual Demo Card - Pædagogisk fokus */}
          <div className="lg:col-span-5 relative hidden lg:block reveal delay-2">
            <div className="relative animate-float-spine" style={{ animationDuration: '7s' }}>
              <div className="bg-white border border-amber-100 p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Modul: Inklusion & Relationer</p>
                    <h3 className="text-xl font-bold text-amber-950 serif">Relations-Spejlet</h3>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-2xl border-l-4 border-emerald-800 italic text-amber-950/70 text-sm">
                    "Hvordan skaber jeg deltagelsesmuligheder for barnet, der trækker sig fra fællesskabet?"
                  </div>
                  
                  <div className="p-8 bg-emerald-950 text-white rounded-2xl shadow-xl transform translate-x-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Faglig Resonans</span>
                    </div>
                    <p className="text-sm text-emerald-50/90 leading-relaxed">
                      "Prøv at analysere barnets position gennem Lave og Wengers begreb om 'legitim perifer deltagelse'. Er rammerne anerkendende nok?"
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 z-20 bg-white p-6 rounded-3xl shadow-xl border border-amber-50 -rotate-6">
                 <Compass className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PEDAGOGICAL TOOLS */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-24 reveal">
            <h2 className="text-5xl font-bold text-amber-950 serif mb-6 leading-tight">
              Værktøjer til det <span className="text-emerald-800 italic">faglige hjerte</span>.
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed">
              At være pædagog er en balancegang mellem intuition og videnskabelig fundering. Cohéro styrker din evne til at navigere i begge verdener.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: <BookMarked className="w-8 h-8" />, 
                title: "Logbog", 
                desc: "Gense dine gemte analyser og refleksioner fra din studietid og praktikforløb.",
                color: "bg-emerald-50 text-emerald-700",
                link: "/min-logbog"
              },
              { 
                icon: <Zap className="w-8 h-8" />, 
                title: "Samtals-træner", 
                desc: "Øv den svære forældresamtale eller tværfaglige sparring i en tryg AI-simulering.",
                color: "bg-amber-50 text-amber-700",
                link: "/case-trainer"
              },
              { 
                icon: <ShieldCheck className="w-8 h-8" />, 
                title: "Dagtilbuds-radaren", 
                desc: "Hold styr på de pædagogiske læreplaner og lovgivningen bag dit daglige arbejde.",
                color: "bg-blue-50 text-blue-700",
                link: "/lov-portal"
              },
              { 
                icon: <Brain className="w-8 h-8" />, 
                title: "Teori-kobleren", 
                desc: "Forvandl dine observationer fra praktikken til faglige analyser baseret på dit pensum.",
                color: "bg-purple-50 text-purple-700",
                link: "/fagligt-mycelium"
              }
            ].map((tool, i) => (
              <Link href={tool.link} key={i} className="group block">
                <div 
                  className="p-10 bg-[#FDFCF8] border border-amber-950/5 rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all duration-500 reveal h-full flex flex-col" 
                  style={{animationDelay: `${0.1 + (i * 0.1)}s`}}
                >
                  <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                    {tool.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-amber-950 serif mb-4">{tool.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-10 flex-grow">{tool.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-900/40 group-hover:text-emerald-800 transition-colors">
                    Udforsk nu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 bg-emerald-950 px-6 text-center relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_70%)]"></div>
         <div className="max-w-4xl mx-auto relative z-10 reveal">
            <h2 className="text-5xl md:text-7xl font-bold text-white serif mb-10 leading-tight tracking-tight">Hver relation tæller.</h2>
            <p className="text-emerald-100/60 text-xl mb-16 max-w-xl mx-auto leading-relaxed">
              Bliv en del af et kollegium, der løfter den pædagogiske faglighed og støtter din udvikling som menneske og professionel.
            </p>
            <button 
              onClick={onStart}
              className="px-16 py-8 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-white hover:scale-110 transition-all shadow-2xl shadow-amber-400/20"
            >
              Start din rejse nu
            </button>
         </div>
      </section>
    </div>
  );
};


export default function PedagoguePage() {
  const { user, openAuthPage } = useApp();
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push('/portal');
    } else {
      openAuthPage('signup');
    }
  };

  return <PedagogueLandingContent onStart={handleStart} />;
}
