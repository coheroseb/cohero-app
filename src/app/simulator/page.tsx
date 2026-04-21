
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  User, 
  Brain, 
  Heart, 
  Mic, 
  MicOff,
  ArrowLeft, 
  Sparkles, 
  History,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/app/provider';
import Link from 'next/link';

// Predefined Personas
const PREDEFINED_PERSONAS = [
  {
    id: 'karen',
    name: 'Karen',
    age: 45,
    role: 'Kontanthjælpsmodtager',
    description: 'Frustreret over systemet og føler sig ikke hørt.',
    emotionalState: 'Frustreret',
    background: 'Karen har været på kontanthjælp i 3 år efter en fyring. Hun har to børn og kæmper med økonomien. Hun har haft mange sagsbehandlere og er træt af at gentage sin historie.',
    currentSituation: 'Hun er indkaldt til en opfølgningssamtale på jobcentret for at tale om hendes rådighed.',
    personalityTraits: ['Skeptisk', 'Direkte', 'Beskyttende overfor sine børn'],
    secretInfo: 'Hun har faktisk fundet et lille deltidsjob sort for at overleve, men tør ikke sige det af frygt for modregning.',
    color: 'bg-rose-500',
    icon: '🗯️'
  },
  {
    id: 'morten',
    name: 'Morten',
    age: 19,
    role: 'Ung uden uddannelse',
    description: 'Tilbageholdende og usikker på fremtiden.',
    emotionalState: 'Usikker',
    background: 'Morten droppede ud af gymnasiet pga. angst. Han bor hjemme hos sin mor og bruger det meste af sin tid på værelset. Han har svært ved social kontakt.',
    currentSituation: 'Første møde med en ungerådgiver for at finde ud af, hvad der skal ske nu.',
    personalityTraits: ['Introvert', 'Høflig', 'Undvigende'],
    secretInfo: 'Han drømmer om at blive grafisk designer, men tror ikke han er god nok.',
    color: 'bg-blue-500',
    icon: '😶'
  },
  {
    id: 'lene',
    name: 'Lene',
    age: 62,
    role: 'Sygemeldt fra job',
    description: 'Bekymret for sit helbred og identitet uden arbejde.',
    emotionalState: 'Bekymret',
    background: 'Lene har arbejdet som SOSU-assistent i 35 år. Hun har nu fået en dårlig ryg og kan ikke passe sit job. Hun er bange for at blive "smidt på porten".',
    currentSituation: 'Samtale om sygedagpenge og mulig omplacering eller førtidspension.',
    personalityTraits: ['Pligtopfyldende', 'Stolt', 'Følsom'],
    secretInfo: 'Hun lider af begyndende depression, som hun prøver at skjule med et smil.',
    color: 'bg-emerald-500',
    icon: '👵'
  }
];

export default function CitizenSimulatorPage() {
  const { user } = useApp();
  const { toast } = useToast();
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotionalState, setCurrentEmotionalState] = useState('');
  const [internalMonologue, setInternalMonologue] = useState('');
  
  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const [interimTranscript, setInterimTranscript] = useState('');
  // Spacebar listener for manual stop/send
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !isLoading && isSimulationActive) {
            e.preventDefault();
            toggleListening();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isLoading, isSimulationActive, interimTranscript]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Stay alive even when user is silent
        recognitionRef.current.lang = 'da-DK';
        recognitionRef.current.interimResults = true; // Show text as we speak

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInterimTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setInterimTranscript(''); 
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast({ title: "Mikrofon fejl", description: "Vi kunne ikke høre dig. Tjek dine indstillinger.", variant: "destructive" });
          }
        };
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startSimulation = (persona: any) => {
    setSelectedPersona(persona);
    setIsSimulationActive(true);
    setCurrentEmotionalState(persona.emotionalState);
    const initialGreeting = `Goddag. Jeg er ${persona.name}. Hvad vil du tale om i dag?`;
    setChatHistory([
      { role: 'model', content: initialGreeting }
    ]);
    speak(initialGreeting);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      // Manual trigger: if user clicks stop, send what we have
      if (interimTranscript) {
        handleSendMessage(interimTranscript);
        setInterimTranscript('');
      }
    } else {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setInterimTranscript('');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = async (text: string) => {
    if (isMuted || typeof window === 'undefined') return;
    
    // Stop any current audio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    // Mapping of personas to professional ElevenLabs Voice IDs (Danish)
    const voiceMap: Record<string, string> = {
        'Karen': 'EXAVITQu4vr4xnSDxMaL', // Bella (Danish)
        'Lene': 'Lcf7uHj9MSqu71uDZDWn',   // Alice (Mature)
        'Morten': 'ZjUnNBDnhXraav7Ba13L', // User provided young man voice
        'Søren': 'ZjUnNBDnhXraav7Ba13L'   // Using same for Søren
    };
    const voice = selectedPersona ? (voiceMap[selectedPersona.name] || 'alloy') : 'alloy';

    try {
        const response = await fetch('/api/simulator/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "TTS API Error");
        }
        
        const { audioDataUri } = await response.json();
        const audio = new Audio(audioDataUri);
        audioRef.current = audio;
        
        setIsSpeaking(true);
        audio.onended = () => {
            setIsSpeaking(false);
            audioRef.current = null;
        };

        audio.onerror = () => {
             console.error("Audio playback error, falling back");
             fallbackSpeak(text);
        };
        
        await audio.play();
    } catch (err: any) {
        console.warn("Falling back to browser TTS:", err);
        
        // Inform user about quota issue if relevant
        if (err.message?.includes('insufficient_quota')) {
            toast({
                title: "Premium AI Stemme deaktiveret",
                description: "Din OpenAI konto er løbet tør for credits. Bruger standard browser stemme.",
                variant: "destructive"
            });
        }
        
        fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'da-DK';
    
    // Find best Danish voice in the browser
    const voices = window.speechSynthesis.getVoices();
    const danishVoices = voices.filter(v => v.lang.startsWith('da'));
    
    // Attempt gender matching for fallback if possible
    let selectedVoice = danishVoices[0];
    if (selectedPersona?.name === 'Morten' || selectedPersona?.name === 'Søren') {
        // Try to find a male-sounding Danish voice
        selectedVoice = danishVoices.find(v => v.name.toLowerCase().includes('magnus') || v.name.toLowerCase().includes('rasmus')) || danishVoices[0];
    } else {
        // Try to find a female-sounding Danish voice
        selectedVoice = danishVoices.find(v => v.name.toLowerCase().includes('sara') || v.name.toLowerCase().includes('ida')) || danishVoices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    // fine-tune pitch and rate for age/gender
    if (selectedPersona?.name === 'Lene') {
        utterance.rate = 0.85; // Older, slightly slower
        utterance.pitch = 0.95;
    } else if (selectedPersona?.name === 'Morten') {
        utterance.rate = 1.05; // Younger, faster
        utterance.pitch = 1.1; 
    } else if (selectedPersona?.name === 'Karen') {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading || !selectedPersona) return;

    const newUserMsg = { role: 'user', content: userMsg };
    const updatedHistory = [...chatHistory, newUserMsg];
    
    setChatHistory(updatedHistory);
    setIsLoading(true);
    setInterimTranscript('');

    try {
      const response = await fetch('/api/simulator/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: updatedHistory, // Use up-to-date history
          citizenPersona: {
            name: selectedPersona.name,
            age: selectedPersona.age,
            background: selectedPersona.background,
            currentSituation: selectedPersona.currentSituation,
            emotionalState: currentEmotionalState,
            personalityTraits: selectedPersona.personalityTraits,
            secretInfo: selectedPersona.secretInfo
          },
          scenarioContext: selectedPersona.currentSituation
        })
      });

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      
      setChatHistory(prev => [...prev, { role: 'model', content: "Borgeren tænker..." }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedText += chunk;

          const emotionMatch = accumulatedText.match(/\[EMOTION:\s*(.*?)\]/i);
          const thoughtsMatch = accumulatedText.match(/\[THOUGHTS:\s*(.*?)\]/i);
          
          if (emotionMatch) setCurrentEmotionalState(emotionMatch[1].trim());
          if (thoughtsMatch) setInternalMonologue(thoughtsMatch[1].trim());

          const parts = accumulatedText.split('---');
          if (parts.length > 1) {
            const actualContent = parts.slice(1).join('---').trim();
            setChatHistory(prev => {
              const newHistory = [...prev];
              newHistory[newHistory.length - 1].content = actualContent;
              return newHistory;
            });
          } else {
            // Show something while waiting for the separator, or if it never comes
            if (accumulatedText.length > 0 && !accumulatedText.startsWith('[')) {
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1].content = accumulatedText;
                  return newHistory;
                });
            }
          }
        }
        
        // Final check: if no separator was found, show the full text minus tags
        const finalParts = accumulatedText.split('---');
        let textToSpeak = "";
        if (finalParts.length > 1) {
            textToSpeak = finalParts.slice(1).join('---').trim();
        } else {
            // Remove tags manually if separator is missing
            textToSpeak = accumulatedText.replace(/\[.*?\]/g, '').trim();
        }

        if (textToSpeak) {
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].content = textToSpeak;
                return newHistory;
            });
            speak(textToSpeak);
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: 'Forbindelsesfejl',
        description: 'Kunne ikke oprette realtids-forbindelse til borgeren.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSimulationActive) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] text-slate-900 selection:bg-rose-100 selection:text-rose-900 pb-20 font-sans">
        <nav className="p-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/portal" className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-black tracking-tighter text-xl">Borger<span className="text-rose-600">Simulatoren</span></span>
          </div>
          <div className="w-12 h-12" />
        </nav>

        <main className="max-w-4xl mx-auto px-6 mt-12">
          <div className="text-center mb-16 space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100"
            >
              <Volume2 className="w-4 h-4" /> Tale-baseret træning
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black serif tracking-tight leading-tight">
              Hold en <span className="italic text-rose-600">rigtig samtale</span> med AI'en
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Simulatoren bruger din stemme til at skabe en naturlig dialog. Træn din samtaleteknik, empati og faglighed direkte gennem tale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PREDEFINED_PERSONAS.map((persona) => (
              <motion.div
                key={persona.id}
                whileHover={{ y: -10 }}
                className="group bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-rose-200 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => startSimulation(persona)}
              >
                <div className={`w-16 h-16 ${persona.color} rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl shadow-${persona.id}-500/20 group-hover:scale-110 transition-transform`}>
                  {persona.icon}
                </div>
                <h3 className="text-2xl font-black mb-1">{persona.name}, {persona.age}</h3>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-4">{persona.role}</p>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {persona.description}
                </p>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start samtale</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-600 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Simulation Sidebar - Reflection & Status */}
      <aside className="w-full md:w-80 lg:w-96 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto z-20">
        <div className="p-8 border-b border-slate-200">
           <Button 
            variant="ghost" 
            className="mb-8 -ml-3 text-slate-500 hover:text-slate-950 hover:bg-white"
            onClick={() => setIsSimulationActive(false)}
           >
             <ArrowLeft className="w-4 h-4 mr-2" /> Afslut samtale
           </Button>

           <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 ${selectedPersona.color} rounded-2xl flex items-center justify-center text-2xl shadow-xl`}>
                {selectedPersona.icon}
              </div>
              <div>
                <h2 className="font-black text-xl">{selectedPersona.name}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{selectedPersona.role}</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-rose-500" /> Følelsesmæssig tilstand
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black uppercase tracking-widest border border-rose-100">
                      {currentEmotionalState}
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="flex-1 p-8 space-y-8">
           <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-500" /> Borgerens indre tanker
              </h3>
              <AnimatePresence mode="wait">
                {internalMonologue ? (
                  <motion.div 
                    key={internalMonologue}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 relative"
                  >
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-indigo-50 border-t border-l border-indigo-100 rotate-45" />
                    <p className="text-sm font-medium text-indigo-900/80 italic leading-relaxed">
                      "{internalMonologue}"
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-10 text-center opacity-30 grayscale flex flex-col items-center gap-4">
                     <Brain className="w-10 h-10" />
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Afventer samtale...</p>
                  </div>
                )}
              </AnimatePresence>
           </section>

           <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" /> Samtalehistorik (Tekst)
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {chatHistory.map((chat, i) => (
                    <div key={i} className={`p-3 rounded-xl text-[11px] font-medium leading-normal ${chat.role === 'user' ? 'bg-slate-200 text-slate-700 ml-4' : 'bg-white border border-slate-100 text-slate-600 mr-4'}`}>
                        <span className="font-black uppercase tracking-tighter mr-1">{chat.role === 'user' ? 'Dig' : selectedPersona.name}:</span>
                        {chat.content}
                    </div>
                ))}
              </div>
           </section>
        </div>
      </aside>

      {/* Voice Interaction Area */}
      <main className="flex-1 flex flex-col items-center justify-center bg-white relative p-10">
        
        {/* Floating Controls */}
        <div className="absolute top-8 right-8 flex items-center gap-4">
             <Button 
                variant="outline" 
                size="icon" 
                className="w-12 h-12 rounded-2xl border-slate-200"
                onClick={() => setIsMuted(!isMuted)}
             >
                {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-slate-600" />}
             </Button>
             <Button 
                variant="outline" 
                size="icon" 
                className="w-12 h-12 rounded-2xl border-slate-200"
                onClick={() => {
                    setChatHistory([{ role: 'model', content: `Okay, lad os prøve igen. Jeg er ${selectedPersona.name}.` }]);
                    speak(`Okay, lad os prøve igen. Jeg er ${selectedPersona.name}.`);
                }}
             >
                <RefreshCcw className="w-5 h-5 text-slate-600" />
             </Button>
        </div>

        {/* Central Avatar Visualizer */}
        <div className="relative flex flex-col items-center gap-12 max-w-xl w-full text-center">
            
            <div className="relative">
                {/* Wave Visualizations */}
                <AnimatePresence>
                    {(isSpeaking || isListening) && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 -m-8"
                        >
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 0, 0.3],
                                        rotate: [0, 90, 180]
                                    }}
                                    transition={{ 
                                        duration: 3, 
                                        repeat: Infinity, 
                                        delay: i * 0.4,
                                        ease: "easeInOut"
                                    }}
                                    className={`absolute inset-0 rounded-[60px] border-2 ${isSpeaking ? 'border-rose-400/30' : 'border-indigo-400/30'}`}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div 
                    animate={isSpeaking ? { y: [0, -10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-40 h-40 ${selectedPersona.color} rounded-[60px] flex items-center justify-center text-7xl shadow-2xl relative z-10`}
                >
                    {selectedPersona.icon}
                </motion.div>
            </div>

            <div className="space-y-4">
                <h3 className="text-3xl font-black serif">
                    {isSpeaking ? `${selectedPersona.name} taler...` : isListening ? "Lytter til dig..." : `Tal med ${selectedPersona.name}`}
                </h3>
                <p className="text-slate-400 font-medium text-lg leading-relaxed px-10">
                    {interimTranscript 
                      ? <span className="text-indigo-600 italic">"{interimTranscript}..."</span>
                      : (chatHistory[chatHistory.length - 1]?.role === 'model' && !isSpeaking
                        ? "Det er din tur til at svare."
                        : chatHistory[chatHistory.length - 1]?.content)
                    }
                </p>
            </div>

            {/* Interaction Button */}
            <div className="mt-8 flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListening}
                    disabled={isLoading || isSpeaking}
                    className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                        isListening 
                        ? 'bg-rose-500 shadow-rose-500/40 text-white' 
                        : 'bg-slate-900 shadow-slate-900/20 text-white hover:bg-slate-800 disabled:opacity-20'
                    }`}
                >
                    {isListening ? (
                        <div className="relative">
                            <MicOff className="w-10 h-10" />
                            <motion.div 
                                animate={{ scale: [1, 2], opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="absolute inset-0 bg-white rounded-full -z-10"
                            />
                        </div>
                    ) : isLoading ? (
                        <Loader2 className="w-10 h-10 animate-spin" />
                    ) : (
                        <Mic className="w-10 h-10" />
                    )}
                </motion.button>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {isListening ? "Tryk for at sende" : "Tryk på mikrofonen for at tale"}
                    </span>
                    <div className="flex gap-1.5">
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">Mellemrum</kbd>
                        <span className="text-[10px] font-bold text-slate-300 italic">virker også</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
             <div className="flex items-center gap-6 opacity-30 grayscale saturate-0 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Powered by</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Google Gemini AI</span>
                <div className="w-[1px] h-4 bg-slate-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">STT & TTS Engine</span>
             </div>
        </div>

      </main>
      
      {/* Spacebar Listener */}
      <KeyPressListener onSpace={toggleListening} disabled={isLoading || isSpeaking} />
    </div>
  );
}

function KeyPressListener({ onSpace, disabled }: { onSpace: () => void, disabled: boolean }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !disabled) {
                e.preventDefault();
                onSpace();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSpace, disabled]);
    return null;
}
