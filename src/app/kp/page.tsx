
'use client';

import React from 'react';
import { 
  Sparkles, 
  Brain, 
  ArrowRight, 
  Star, 
  Users, 
  Heart, 
  Zap, 
  Compass, 
  Quote, 
  Baby, 
  ShieldCheck,
  Landmark,
  MapPin,
  GraduationCap,
  BookOpen,
  Scale,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface KPLandingPageContentProps {
  onStart: () => void;
}

const FloatingIcon: React.FC<{ icon: React.ReactNode; className: string; delay: string }> = ({ icon, className, delay }) => (
  <div 
    style={{ animationDelay: delay }}
    className={`absolute opacity-10 animate-float pointer-events-none ${className}`}
  >
    {icon}
  </div>
);

const KPLandingPageContent: React.FC<KPLandingPageContentProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* KP-Specifikke Baggrundselementer */}
      <FloatingIcon icon={<Landmark size={80} />} className="top-20 left-10" delay="0s" />
      <FloatingIcon icon={<MapPin size={60} />} className="bottom-40 right-20" delay="2s" />
      <FloatingIcon icon={<GraduationCap size={100} />} className="top-1/2 left-1/4" delay="1s" />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[100vw] bg-indigo-50/30 rounded-full blur-[150px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-10">
            <div className="reveal inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-indigo-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-950">Eksklusivt for KP • Tagensvej & Sigurdsgade</span>
            </div>
            
            <h1 className="animate-ink text-6xl md:text-8xl font-bold text-amber-950 serif leading-[0.9] tracking-tighter">
              Bliv en stærkere <span className="text-indigo-800 italic relative">
                KP-studerende
                <svg className="absolute -bottom-4 left-0 w-full h-4 text-indigo-300/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" className="animate-draw" />
                </svg>
              </span> gennem kollegial sparring.
            </h1>
            
            <p className="reveal delay-1 text-xl md:text-2xl text-slate-600/80 max-w-xl leading-relaxed font-medium">
              Cohéro er skabt af studerende til studerende på Københavns Professionshøjskole. Få rygdækning til dine sager, din jura og dit professionelle skøn.
            </p>
            
            <div className="reveal delay-2 flex flex-col sm:flex-row items-center gap-8 pt-4">
              <button 
                onClick={onStart}
                className="group relative px-12 py-6 bg-indigo-950 text-white rounded-2xl text-xl font-bold transition-all hover:bg-indigo-900 hover:shadow-2xl hover:scale-105 active:scale-95 w-full sm:w-auto overflow-hidden shadow-xl shadow-indigo-900/20"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Opret gratis KP-profil
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              
              <div className="flex flex-col gap-1">
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-500 fill-amber-500" />)}
                 </div>
                 <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest">Brugt af 450+ medstuderende på KP</p>
              </div>
            </div>
          </div>

          {/* KP Context Card */}
          <div className="lg:col-span-5 relative hidden lg:block reveal delay-2">
            <div className="relative animate-float-spine" style={{ animationDuration: '9s' }}>
              <div className="bg-white border border-indigo-100 p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Campus: Tagensvej 86</p>
                    <h3 className="text-xl font-bold text-amber-950 serif">Hovedstads-Netværket</h3>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border-l-4 border-indigo-800">
                    <p className="text-xs font-black uppercase text-indigo-900 mb-2">Populært på KP lige nu</p>
                    <p className="text-sm text-indigo-950/70 italic font-medium">
                      "Hvordan bruger vi narrativ teori i arbejdet med udsatte unge på Nørrebro?"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white border border-indigo-50 rounded-2xl shadow-sm hover:translate-x-2 transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-900">JS</div>
                    <p className="text-xs text-slate-500 font-medium">Julie (Semester 4) søger læsegruppe til forvaltningsret.</p>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-indigo-50 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Aktiv Sparring</span>
                   </div>
                   <button onClick={onStart} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-900 transition-colors">Se opslagstavle</button>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 z-20 bg-indigo-950 p-6 rounded-3xl shadow-xl text-white rotate-6 group cursor-pointer hover:rotate-0 transition-transform">
                 <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & SOCIAL PROOF */}
      <section className="py-12 bg-white border-y border-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center gap-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-900">VIA University College</span>
              <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-900">Københavns Professionshøjskole</span>
              <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-900">UCL Erhvervsakademi</span>
              <span className="text-sm font-black uppercase tracking-[0.4em] text-indigo-900">Absalon</span>
           </div>
        </div>
      </section>

      {/* WHY JOIN COHERO @ KP */}
      <section className="py-32 bg-[#FDFCF8] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-24 reveal text-center md:text-left">
            <h2 className="text-5xl font-bold text-amber-950 serif mb-6 leading-tight">
              Gør studielivet på KP <span className="text-indigo-800 italic">lettere</span> og mere professionelt.
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed">
              Vi ved, at pensum på KP kan være tungt, og at praktikpladserne i København kræver overblik. Cohéro giver dig værktøjerne til at mestre begge dele.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                title: "KP-Pensum Sparring", 
                desc: "Vores AI er trænet i den specifikke litteraturliste, der anvendes på KP. Få hurtige resuméer og praksis-koblinger.",
                icon: <BookOpen className="w-8 h-8" />,
                color: "bg-indigo-50 text-indigo-700"
              },
              { 
                title: "Lokal Netværks-puls", 
                desc: "Se hvad der rører sig på Tagensvej. Find læsegrupper på tværs af semestre og del erfaringer fra de københavnske kommuner.",
                icon: <Users className="w-8 h-8" />,
                color: "bg-amber-50 text-amber-700"
              },
              { 
                title: "Eksamens-Bootcamps", 
                desc: "Forbered dig specifikt til KP's prøveformer. Træn dine mundtlige oplæg med AI-feedback baseret på bedømmelseskriterierne.",
                icon: <GraduationCap className="w-8 h-8" />,
                color: "bg-emerald-50 text-emerald-700"
              }
            ].map((feature, i) => (
              <div key={i} className="group p-10 bg-white border border-indigo-100 rounded-[3rem] hover:bg-indigo-950 hover:border-indigo-950 transition-all duration-500 reveal shadow-sm hover:shadow-2xl">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white transition-all shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-amber-950 serif mb-4 group-hover:text-white transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8 group-hover:text-indigo-100/70 transition-colors">{feature.desc}</p>
                <div 
                  onClick={onStart}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-900/40 group-hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Start din profil <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE SECTION */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-12">
              <MessageSquare className="w-10 h-10 text-amber-700" />
           </div>
           <blockquote className="text-3xl md:text-5xl font-bold text-amber-950 serif leading-tight italic mb-12">
             "Cohéro har givet mig den faglige rygdækning, jeg manglede i min praktik. At kunne tjekke juraen og få sparring på mine journaler har gjort mig langt mere tryg i myndighedsrollen."
           </blockquote>
           <div>
              <p className="text-lg font-bold text-indigo-950">Mads Henriksen</p>
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Socialrådgiverstuderende, 6. semester, KP</p>
           </div>
        </div>
      </section>

      {/* HOW IT WORKS / MOTIVATION */}
      <section className="py-32 bg-indigo-50/50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                 <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-amber-950 serif mb-6">Alt hvad du behøver på ét sted.</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                       Glem alt om spredte noter og usikkerhed før eksamen. Cohéro samler din faglige dannelse i et system, der lærer sammen med dig.
                    </p>
                 </div>

                 <div className="space-y-6">
                    {[
                      { title: "Journal-træner", text: "Få feedback på dit sprog og dine juridiske henvisninger.", icon: <Scale size={20} /> },
                      { title: "Fagligt Mycelium", text: "Se hvordan teorierne fra pensum kobler sig til din hverdag.", icon: <Brain size={20} /> },
                      { title: "Politisk Puls", text: "Følg med i hvordan nye love påvirker dit fremtidige arbejde.", icon: <Zap size={20} /> }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-6 items-start group">
                         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {item.icon}
                         </div>
                         <div>
                            <h4 className="font-bold text-amber-950 text-lg mb-1">{item.title}</h4>
                            <p className="text-slate-500 text-sm">{item.text}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="relative">
                 <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl border border-indigo-100 relative z-10">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                      alt="KP Studerende i samarbejde" 
                      className="rounded-[3rem] w-full h-[600px] object-cover"
                      data-ai-hint="students collaborating"
                    />
                    <div className="absolute -bottom-10 -left-10 bg-indigo-950 text-white p-10 rounded-[2.5rem] shadow-2xl max-w-xs reveal delay-3">
                       <p className="text-2xl font-bold serif mb-4">450+</p>
                       <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Medstuderende fra KP er allerede medlemmer</p>
                    </div>
                 </div>
                 <div className="absolute top-20 -right-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
              </div>
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 bg-indigo-950 px-6 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_70%)]"></div>
         <div className="max-w-4xl mx-auto relative z-10 reveal">
            <h2 className="text-5xl md:text-7xl font-bold text-white serif mb-10 leading-tight tracking-tight">Sammen løfter vi KP.</h2>
            <p className="text-indigo-100/60 text-xl mb-16 max-w-xl mx-auto leading-relaxed">
              Bliv en del af Danmarks stærkeste kollegiale fællesskab for socialrådgivere og pædagoger under uddannelse. Det tager kun 30 sekunder at komme i gang.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onStart}
                className="px-16 py-8 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-white hover:scale-110 transition-all shadow-2xl shadow-amber-400/20 w-full sm:w-auto"
              >
                Start din profil i dag
              </button>
              <button 
                onClick={onStart}
                className="px-16 py-8 bg-white/5 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-white/10 transition-all w-full sm:w-auto"
              >
                Se medlemsfordele
              </button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-4 text-indigo-400/50 text-xs font-bold uppercase tracking-widest">
               <CheckCircle2 size={16} /> Ingen binding
               <span className="w-1 h-1 bg-indigo-400/20 rounded-full"></span>
               <CheckCircle2 size={16} /> 100% anonymt
               <span className="w-1 h-1 bg-indigo-400/20 rounded-full"></span>
               <CheckCircle2 size={16} /> Kun for studerende
            </div>
         </div>
         {/* Background text decoration */}
         <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[15vw] font-black text-white/5 whitespace-nowrap pointer-events-none select-none serif italic">
           Københavns Professionshøjskole
         </div>
      </section>
    </div>
  );
};


export default function KPPage() {
  const { user, openAuthModal } = useApp();
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push('/portal');
    } else {
      openAuthModal('signup');
    }
  };

  return <KPLandingPageContent onStart={handleStart} />;
}
