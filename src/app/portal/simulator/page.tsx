'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, User, Zap, Heart, Shield, ArrowRight, RefreshCw, 
  ChevronLeft, AlertCircle, CheckCircle2, Star, TrendingUp, Brain,
  Sparkles, Send, Loader2, Info, Activity, Target, Lightbulb, Construction
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/app/provider';
import { 
  runSimulationTurnAction, 
  generateSimulationReportAction, 
  generateSimulationScenarioAction,
  semanticLawSearchAction
} from '@/app/actions';
import { SimulationCitizen } from '@/ai/flows/types';
import Link from 'next/link';

// --- Default Scenarios ---
const DEFAULT_SCENARIOS = [
  {
    id: 'child-neglect',
    title: 'Frustreret Forælder',
    topic: 'Underretning om barnets trivsel',
    description: 'Du skal tale med Mette over telefonen. Der er kommet en underretning fra skolen om hendes søn, Lucas på 8 år. Mette er i forsvars-position.',
    profession: 'Socialrådgiver',
    icon: Heart,
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 'youth-crime',
    title: 'Den Utrygge Unge',
    topic: 'Løsladelsessamtale',
    description: 'Samtale med Jonas på 17, der lige er blevet løsladt fra varetægtsfængsling. Han er skeptisk over for systemet og har svært ved at åbne op.',
    profession: 'Socialrådgiver',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'pedagogue-conflict',
    title: 'Konflikthåndtering',
    topic: 'Samarbejde med plejeforældre',
    description: 'En pædagogisk udfordring hvor du skal guide en frustreret plejefar gennem en svær episode med et barn.',
    profession: 'Pædagog',
    icon: Brain,
    color: 'from-emerald-500 to-teal-600'
  }
];

export default function SimulatorPage() {
  const { user, userProfile } = useApp();
  const { toast } = useToast();
  const [stage, setStage] = useState<'lobby' | 'creating' | 'chat' | 'report'>('lobby');
  const [citizen, setCitizen] = useState<SimulationCitizen | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [trustLevel, setTrustLevel] = useState(30);
  const [emotionalState, setEmotionalState] = useState('Utryg');
  const [internalThoughts, setInternalThoughts] = useState<string[]>([]);
  const [report, setReport] = useState<any>(null);
  const [legalContext, setLegalContext] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
 
  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAiThinking]);

  // Handle Scenario Selection
  const startScenario = async (topic: string) => {
    setStage('creating');
    try {
      // Fetch relevant law from Lovportal
      const lawRes = await semanticLawSearchAction(topic);
      const context = lawRes?.data?.summary || "";
      setLegalContext(context);

      const res = await generateSimulationScenarioAction({ 
        topic, 
        profession: userProfile?.profession || 'Socialrådgiver',
        legalContext: context
      });
       if (res.data) {
        setCitizen(res.data);
        setTrustLevel(res.data.initialTrustLevel || 30);
        setEmotionalState(res.data.emotionalState || 'Utryg');
        setChatHistory([{ 
          role: 'assistant', 
          content: `Hej... det er ${res.data.name}. Hvad vil du mig nu igen?` 
        }]);
        setStage('chat');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke oprette scenariet.' });
      setStage('lobby');
    }
  };

  // Handle Chat Input
  const handleSend = async () => {
    if (!userInput.trim() || isAiThinking || !citizen) return;

    const currentInput = userInput;
    setUserInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: currentInput }]);
    setIsAiThinking(true);

    try {
      const res = await runSimulationTurnAction({
        citizen,
        chatHistory: chatHistory,
        userInput: currentInput,
        profession: userProfile?.profession
      });

      if (res.data) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.citizenResponse }]);
        setTrustLevel(res.data.trustLevel);
        setEmotionalState(res.data.currentEmotionalState);
        if (res.data.internalThought) {
          setInternalThoughts(prev => [res.data.internalThought, ...prev].slice(0, 3));
        }

        if (res.data.isSimulationEnded) {
          setTimeout(() => finishSimulation(), 2000);
        }
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke hente svar fra borgeren.' });
    } finally {
      setIsAiThinking(false);
    }
  };

  // Finish and get report
  const finishSimulation = async () => {
    setStage('creating'); // Reuse creating for loading report
    try {
      const res = await generateSimulationReportAction({
        citizen: citizen!,
        chatHistory,
        profession: userProfile?.profession,
        legalContext
      });
      setReport(res.data);
      setStage('report');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke generere din evaluering.' });
      setStage('chat');
    }
  };

  return (
    <div className="h-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-[1400px] mx-auto px-6 w-full flex-1 flex flex-col overflow-hidden">
        
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-4 shrink-0">
          <Link href="/portal" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950 transition-all">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Tilbage til portalen
          </Link>
          
          <div className="flex items-center gap-3">
             <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Beta
             </div>
             {stage === 'chat' && (
               <Button variant="outline" size="sm" onClick={() => window.confirm('Afslut simulering?') && finishSimulation()} className="rounded-full h-8 text-[10px] font-black uppercase tracking-widest">
                  Afslut & Evaluér
               </Button>
             )}
          </div>
        </header>

        {/* Under Development Banner */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-[28px] px-8 py-6 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Construction className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-amber-900 tracking-tight">Funktionen er under udvikling</h3>
              <p className="text-[13px] text-amber-700/80 font-medium mt-0.5">Simulatoren er på vej — vi arbejder på at gøre den klar til dig. Hold øje med opdateringer!</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
          
          {/* STAGE: LOBBY */}
          {stage === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center h-full overflow-y-auto pb-20 pt-4"
            >
              <div className="mb-6">
                 <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mx-auto mb-8 animate-bounce">
                    <MessageSquare className="w-10 h-10" />
                 </div>
                 <h1 className="text-5xl font-black text-slate-950 serif mb-6 tracking-tight">Simulatoren: Den Digitale Borger</h1>
                 <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                   Træn "den svære samtale" i et trygt rum. Vores AI-borgere reagerer realistisk på dine juridiske argumenter og din empatiske tilgang.
                 </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {DEFAULT_SCENARIOS.map((scenario) => (
                  <button 
                    key={scenario.id}
                    onClick={() => startScenario(scenario.topic)}
                    className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-left group hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700`}>
                      <scenario.icon className="w-24 h-24" />
                    </div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${scenario.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-current/10`}>
                      <scenario.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{scenario.title}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{scenario.topic}</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{scenario.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      Start simulering <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-16 p-8 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-8 text-left relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-8 h-8 text-amber-500" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1">Skræddersy dit eget scenarie?</h4>
                    <p className="text-slate-400 text-sm font-medium">Har du en specifik sagstype eller konflikt du vil øve? Skriv emnet herunder.</p>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="F.eks. Skilsmisse-konflikt..."
                      className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
                    />
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]">Generér</Button>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STAGE: CREATING / LOADING */}
          {stage === 'creating' && (
            <motion.div 
              key="creating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-8"
            >
              <div className="relative">
                 <RefreshCw className="w-20 h-20 text-indigo-100 animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
                 </div>
              </div>
              <div className="text-center">
                 <h2 className="text-2xl font-black text-slate-900 serif mb-2">AI'en forbereder samtalen...</h2>
                 <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Opbygger citizen persona & juridisk kontekst</p>
              </div>
            </motion.div>
          )}

          {/* STAGE: CHAT (The Simulation) */}
          {stage === 'chat' && citizen && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid lg:grid-cols-[1fr_380px] gap-8 h-full min-h-0 overflow-hidden relative"
            >
              {/* Left Side: Chat Interface */}
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden flex flex-col relative h-full">
                
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                         {citizen.name.charAt(0)}
                      </div>
                      <div>
                         <h2 className="font-bold text-slate-900">{citizen.name}</h2>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{citizen.age} år • {citizen.emotionalState}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 pr-2">
                       <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tillid (Trust)</p>
                          <div className="flex items-center gap-2">
                             <Progress value={trustLevel} className="w-32 h-2" />
                             <span className="text-xs font-black text-slate-900">{trustLevel}%</span>
                          </div>
                       </div>
                   </div>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth min-h-0">
                   {chatHistory.map((msg, i) => (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                     >
                        <div className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-sm ${
                          msg.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                           <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                     </motion.div>
                   ))}
                   {isAiThinking && (
                     <div className="flex justify-start">
                        <div className="bg-slate-50 rounded-3xl rounded-tl-none px-6 py-4 flex gap-2">
                           <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce" />
                           <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce delay-100" />
                           <div className="w-2 h-2 bg-slate-200 rounded-full animate-bounce delay-200" />
                        </div>
                     </div>
                   )}
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-slate-50 bg-white shrink-0">
                   <div className="relative group">
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-end gap-3 p-2 bg-slate-50 rounded-[28px] border border-slate-100 focus-within:border-indigo-200 focus-within:bg-white transition-all">
                        <textarea 
                           value={userInput}
                           onChange={(e) => setUserInput(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               handleSend();
                             }
                           }}
                           placeholder="Skriv din replik her..."
                           className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-4 px-4 min-h-[56px] max-h-[150px] resize-none outline-none"
                        />
                        <button 
                          onClick={handleSend}
                          disabled={!userInput.trim() || isAiThinking}
                          className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-lg shadow-indigo-500/20 mb-1 mr-1"
                        >
                           <Send className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                   <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Tip: Brug dine mæglingsevner og henvis gerne til loven for at skabe tryghed.</p>
                </div>
              </div>

              {/* Right Side: Sidebar Info */}
              <div className="space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">
                 
                 {/* Mission / Objective Card */}
                 <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                       <Target className="w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                             <Target className="w-4 h-4" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Din Mission</h4>
                       </div>
                       <p className="text-[15px] font-bold leading-relaxed">
                          {citizen.userObjective}
                       </p>
                    </div>
                 </div>

                 {/* Citizen Profile Card */}
                 <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                       </div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Monitor</h4>
                    </div>
                    
                    <div className="space-y-6">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Følelsesmæssig Tilstand</p>
                          <div className={`px-4 py-3 rounded-2xl font-bold flex items-center gap-3 border ${
                            emotionalState === 'Frustreret' || emotionalState === 'Aggressiv' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            emotionalState === 'Utryg' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                             <div className={`w-2 h-2 rounded-full animate-pulse ${
                                emotionalState === 'Frustreret' || emotionalState === 'Aggressiv' ? 'bg-rose-500' :
                                emotionalState === 'Utryg' ? 'bg-amber-500' : 'bg-emerald-500'
                             }`} />
                             {emotionalState}
                          </div>
                       </div>

                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Baggrundsinformation</p>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed italic border-l-2 border-indigo-100 pl-4">
                            "{citizen.background.substring(0, 150)}..."
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Internal Thoughts (PREMIUM FEATURE VIBE) */}
                 <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                       <Zap className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                       <Brain className="w-5 h-5 text-amber-500" />
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Interne Tanker</h4>
                    </div>
                    <div className="space-y-4 relative z-10">
                       {internalThoughts.length === 0 ? (
                         <p className="text-xs text-slate-500 italic">Lyt efter hvad der bliver sagt mellem linjerne...</p>
                       ) : (
                         internalThoughts.map((thought, idx) => (
                           <motion.div 
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             key={idx} 
                             className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[13px] font-medium leading-relaxed text-indigo-100 italic"
                           >
                             "{thought}"
                           </motion.div>
                         ))
                       )}
                    </div>
                 </div>

                 {/* Methods Toolkit */}
                 <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Lightbulb className="w-4 h-4" />
                       </div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Metode-Værktøjskasse</h4>
                    </div>
                    
                    <div className="space-y-4">
                       {[
                          { 
                            name: 'Motiverende Samtale (MI)', 
                            desc: 'Brug åbne spørgsmål og bekræftelser for at mindske modstand.',
                            color: 'bg-emerald-50 text-emerald-700'
                          },
                          { 
                            name: 'Systemisk Tilgang', 
                            desc: 'Stil cirkulære spørgsmål: "Hvad tror du Maria tænker om..."',
                            color: 'bg-blue-50 text-blue-700'
                          },
                          { 
                            name: 'Legal Framing', 
                            desc: 'Henvis roligt til Servicelovens rammer for at skabe struktur.',
                            color: 'bg-purple-50 text-purple-700'
                          },
                          { 
                            name: 'Low Arousal', 
                            desc: 'Spejl borgerens tempo og undgå direkte konfrontation.',
                            color: 'bg-amber-50 text-amber-700'
                          }
                       ].map((tech, i) => (
                          <div key={i} className="group cursor-default">
                             <div className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider mb-2 inline-block ${tech.color}`}>
                                {tech.name}
                             </div>
                             <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                {tech.desc}
                             </p>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Quick Help */}
                 <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-600/20">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                       <Info className="w-4 h-4" /> Brug for sparring?
                    </h4>
                    <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6 opacity-80">
                      Er du i tvivl om næste skridt? Du kan altid afslutte simuleringen og få en fuld AI-evaluering af dit forløb indtil nu.
                    </p>
                    <Button onClick={finishSimulation} className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl h-10 font-black text-[10px] uppercase tracking-widest">
                       Få Evaluering Nu
                    </Button>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STAGE: REPORT */}
          {stage === 'report' && report && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8 pb-32 h-full overflow-y-auto pt-4"
            >
               {/* Report Header */}
               <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="w-20 h-20 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 mx-auto mb-8">
                     <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-950 serif mb-4">Simulering Fuldført</h2>
                  <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mb-10">Flot arbejde! Her er din personlige feedback baseret på din samtale med {citizen?.name}.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-3xl font-black text-slate-900">{report.score}%</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empati-Niveau</p>
                        <p className="text-3xl font-black text-indigo-600">Høj</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Slut-Tillid</p>
                        <p className="text-3xl font-black text-emerald-600">{trustLevel}%</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tid</p>
                        <p className="text-3xl font-black text-slate-900">4:20</p>
                     </div>
                  </div>
               </div>

               {/* Feedback Grid */}
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                           <Shield className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-black text-slate-950 serif">Juridisk Fokus</h4>
                     </div>
                     <p className="text-[15px] text-slate-600 font-medium leading-relaxed">{report.legalFeedback}</p>
                  </div>

                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                           <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-black text-slate-950 serif">Kommunikation</h4>
                     </div>
                     <p className="text-[15px] text-slate-600 font-medium leading-relaxed">{report.communicationFeedback}</p>
                  </div>
               </div>

               {/* Citizen Experience Card */}
               <div className="bg-slate-950 p-10 rounded-[48px] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                     <User className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-8">
                        <Heart className="w-6 h-6 text-rose-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Borgerens Oplevelse</h4>
                     </div>
                     <p className="text-2xl font-black serif max-w-2xl leading-tight mb-8">
                       "{report.citizenExperience}"
                     </p>
                     <div className="flex flex-wrap gap-3">
                        {report.learningPoints.map((point: string, i: number) => (
                           <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-300">
                              {point}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Footer Actions */}
               <div className="flex items-center justify-center gap-6 pt-12">
                  <Button 
                    onClick={() => {
                       setStage('lobby');
                       setChatHistory([]);
                       setReport(null);
                    }}
                    className="h-14 px-10 rounded-[20px] bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20"
                  >
                    Prøv et nyt scenarie
                  </Button>
                  <Button variant="outline" className="h-14 px-10 rounded-[20px] text-slate-600 font-black uppercase text-xs tracking-widest">
                    Gem feedback
                  </Button>
               </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
