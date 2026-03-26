'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Plus, 
  History, 
  Settings, 
  Trash2, 
  MessageCircle, 
  ChevronRight, 
  User as UserIcon,
  Bot,
  Scale,
  FileText,
  Users,
  Brain,
  Zap,
  MoreVertical,
  Paperclip,
  Mic,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { unifiedChatAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: any;
  persona?: PersonaType;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: any;
  persona?: PersonaType;
}

type PersonaType = 'kollega' | 'legal' | 'case' | 'social_work';

const personas = [
  { id: 'kollega', name: 'Almen Kollega', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Generel faglig sparring og refleksion' },
  { id: 'legal', name: 'Lovgiveren', icon: Scale, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100', desc: 'Dyk ned i paragraffer og lovgivning' },
  { id: 'case', name: 'Case-træner', icon: Brain, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Træn dit faglige skøn i konkrete sager' },
  { id: 'social_work', name: 'Metode-ekspert', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'Sparring om faglige metoder og dokumentation' },
];

const UnifiedChatPage: React.FC = () => {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [activePersona, setActivePersona] = useState<PersonaType>('kollega');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Auth Redirect ---
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  // --- Fetch Conversations ---
  useEffect(() => {
    if (!user || !firestore) return;
    
    const q = query(
      collection(firestore, 'users', user.uid, 'conversations'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      setConversations(convs);
    });

    return unsubscribe;
  }, [user, firestore]);

  // --- Fetch Messages for Active Conversation ---
  useEffect(() => {
    if (!user || !firestore || !activeConversationId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(firestore, 'users', user.uid, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [user, firestore, activeConversationId]);

  // --- Scroll to Bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handle Send ---
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSending || !user || !firestore) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);

    let currentConvId = activeConversationId;

    try {
      // 1. Create conversation if none active
      if (!currentConvId) {
        const convRef = await addDoc(collection(firestore, 'users', user.uid, 'conversations'), {
          title: messageContent.slice(0, 40) + (messageContent.length > 40 ? '...' : ''),
          lastMessage: messageContent,
          updatedAt: serverTimestamp(),
          persona: activePersona,
          userId: user.uid
        });
        currentConvId = convRef.id;
        setActiveConversationId(currentConvId);
      } else {
        await updateDoc(doc(firestore, 'users', user.uid, 'conversations', currentConvId), {
          lastMessage: messageContent,
          updatedAt: serverTimestamp()
        });
      }

      // 2. Add user message
      await addDoc(collection(firestore, 'users', user.uid, 'conversations', currentConvId, 'messages'), {
        role: 'user',
        content: messageContent,
        createdAt: serverTimestamp(),
        persona: activePersona
      });

      // 3. Call AI
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await unifiedChatAction({
        message: messageContent,
        chatHistory: chatHistory as any,
        persona: activePersona
      });

      // 4. Add assistant message
      if (response && response.data) {
        await addDoc(collection(firestore, 'users', user.uid, 'conversations', currentConvId, 'messages'), {
          role: 'assistant',
          content: response.data.answer,
          createdAt: serverTimestamp(),
          persona: activePersona
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende besked. Prøv igen.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // --- Handle New Chat ---
  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setIsMobileSidebarOpen(false);
    inputRef.current?.focus();
  };

  // --- Handle Delete Conversation ---
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore || !window.confirm('Vil du slette denne samtale?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'conversations', id));
      if (id === activeConversationId) {
        startNewChat();
      }
      toast({ title: "Slettet", description: "Samtalen er fjernet fra historikken." });
    } catch (err) {
      console.error(err);
    }
  };

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  const activePersonaInfo = personas.find(p => p.id === activePersona)!;

  return (
    <div className="flex h-[100dvh] pt-24 md:pt-32 bg-[#FAFAF7] overflow-hidden text-slate-900 font-sans selection:bg-amber-100">
      
      {/* SIDEBAR - DESKTOP */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-amber-950/5 flex flex-col relative z-20 shadow-2xl shadow-amber-950/5"
      >
        <div className="p-6 flex flex-col h-full">
          <Button 
            onClick={startNewChat}
            className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] mb-8 shadow-xl shadow-amber-950/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Ny Samtale
          </Button>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 -mr-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-3 flex items-center gap-2">
              <History className="w-3 h-3" /> Historik
            </h3>
            {conversations.length === 0 ? (
                <div className="text-center py-12 px-6">
                    <p className="text-[11px] text-slate-300 font-medium italic">Ingen tidligere samtaler endnu.</p>
                </div>
            ) : conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => { setActiveConversationId(conv.id); setIsMobileSidebarOpen(false); }}
                className={`group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${activeConversationId === conv.id ? 'bg-amber-50 border border-amber-100' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeConversationId === conv.id ? 'bg-white shadow-sm text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-white transition-colors'}`}>
                  {personas.find(p => p.id === conv.persona)?.icon ? React.createElement(personas.find(p => p.id === conv.persona)!.icon, { className: 'w-5 h-5' }) : <MessageCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-black truncate leading-tight ${activeConversationId === conv.id ? 'text-amber-950' : 'text-slate-600'}`}>{conv.title}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-1">{conv.lastMessage}</p>
                </div>
                <button 
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-amber-950/5 mt-auto">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm">
                {user?.displayName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-amber-950 truncate">{user?.displayName?.split(' ')[0]}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{userProfile?.membership || 'Kollega'}</p>
              </div>
              <Settings className="w-4 h-4 text-slate-300 cursor-pointer hover:text-slate-500" />
            </div>
          </div>
        </div>
      </motion.aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-[#FAFAF7] h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/60 backdrop-blur-2xl border-b border-amber-950/5 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:flex hidden p-2.5 bg-white border border-amber-950/5 text-amber-950 rounded-xl hover:bg-amber-950 hover:text-white transition-all active:scale-90"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden flex p-2.5 bg-white border border-amber-950/5 text-amber-950 rounded-xl active:scale-90"
            >
                <History className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-amber-950/10 hidden sm:block"></div>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${activePersonaInfo.bg} ${activePersonaInfo.color} ${activePersonaInfo.border} border`}>
                    <activePersonaInfo.icon className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-sm font-black text-amber-950 tracking-tight leading-none mb-1">{activePersonaInfo.name}</h2>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{activePersonaInfo.desc}</p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 p-1.5 rounded-2xl border border-amber-950/5 shadow-sm">
             {personas.map(p => (
               <button 
                key={p.id}
                onClick={() => setActivePersona(p.id as any)}
                title={p.name}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activePersona === p.id ? `${p.bg} ${p.color} shadow-sm border ${p.border}` : 'text-slate-300 hover:text-slate-500'}`}
               >
                 <p.icon className="w-5 h-5" />
               </button>
             ))}
          </div>
        </header>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 lg:px-20 custom-scrollbar relative z-10 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-20 space-y-10">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-900 to-amber-950 rounded-[2.5rem] flex items-center justify-center text-amber-400 shadow-2xl relative">
                  <Bot className="w-12 h-12" />
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-4 border-[#FAFAF7]"><Sparkles className="w-4 h-4"/></div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black text-amber-950 tracking-tight serif">Hvad leder du efter i dag?</h1>
                  <p className="text-slate-400 font-medium text-lg lg:text-xl italic">Spørg din digitale kollega om alt fra lovgivning til praktisk socialt arbejde.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl px-6">
                  {[
                    { q: "Forklar Barnets Lov § 32 på en enkel måde", p: 'legal' },
                    { q: "Giv mig sparring på et etisk dilemma om magtanvendelse", p: 'kollega' },
                    { q: "Hvad er de vigtigste principper i VUM?", p: 'social_work' },
                    { q: "Hvordan opbygger jeg en stærk pædagogisk observation?", p: 'case' }
                  ].map((suggestion, i) => (
                    <button 
                        key={i} 
                        onClick={() => { setActivePersona(suggestion.p as any); setInput(suggestion.q); }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 text-left hover:border-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all group active:scale-95"
                    >
                      <p className="text-sm font-bold text-slate-700 group-hover:text-amber-950 leading-relaxed mb-3">"{suggestion.q}"</p>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {personas.find(p => p.id === suggestion.p)?.icon && React.createElement(personas.find(p => p.id === suggestion.p)!.icon, { className: 'w-3.5 h-3.5' })}
                          <span>Prøv denne</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((m, idx) => (
                <motion.div 
                  key={m.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-amber-950 text-amber-400' : 'bg-white border border-amber-950/5 text-amber-900'}`}>
                    {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    {m.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cohéro AI</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                    )}
                    <div className={`p-6 md:p-8 rounded-[2rem] shadow-sm leading-[1.8] font-medium text-lg whitespace-pre-wrap ${m.role === 'user' ? 'bg-amber-950 text-amber-50 rounded-tr-none' : 'bg-white border border-amber-950/5 text-slate-800 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                    {m.role === 'assistant' && (
                        <div className="flex items-center gap-4 mt-4 px-4">
                             <button className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-amber-600 transition-colors">Kopiér</button>
                             <button className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 transition-colors">Rapportér</button>
                        </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-white border border-amber-950/5 flex items-center justify-center text-amber-900 shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-amber-950/5 flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-amber-900 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-amber-700 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analyserer forespørgsel...</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-64" />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none z-40 bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7] to-transparent pt-20">
          <div className="max-w-4xl mx-auto w-full pointer-events-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-20 transition duration-1000"></div>
              <div className="relative bg-white border border-amber-950/10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(69,26,3,0.1)] flex items-end p-2 pr-4 transition-all focus-within:shadow-[0_20px_50px_-15px_rgba(69,26,3,0.2)]">
                
                <button className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-all shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea 
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Spørg din ${activePersonaInfo.name.toLowerCase()}... (Skift til ${input.length % 2 === 0 ? 'Lovgiver' : 'Kollega'} i toppen)`}
                  rows={1}
                  className="w-full bg-transparent border-none focus:ring-0 text-amber-950 font-medium text-lg min-h-[56px] py-4 px-4 resize-none leading-relaxed placeholder:text-slate-300 placeholder:italic"
                  style={{ height: 'auto', minHeight: '56px', maxHeight: '200px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                
                <div className="flex items-center gap-2 shrink-0 h-14">
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-all">
                    <Mic className="w-5 h-5" />
                  </button>
                  <Button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isSending}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-amber-950 text-amber-400 shadow-xl shadow-amber-950/40 hover:scale-105 active:scale-95' : 'bg-slate-50 text-slate-200 shadow-none'}`}
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Skift perspektiv:</p>
                <div className="flex gap-4">
                    {personas.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setActivePersona(p.id as any)}
                            className={`flex items-center gap-2 group transition-all ${activePersona === p.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <div className={`p-1.5 rounded-lg ${p.bg} ${p.color} border ${p.border}`}>
                                <p.icon className="w-3 h-3" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${activePersona === p.id ? 'text-amber-950' : 'text-slate-400'}`}>{p.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsMobileSidebarOpen(false)}
               className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 left-0 w-80 bg-white z-[110] lg:hidden p-6 shadow-2xl"
            >
               <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-amber-950 tracking-tight serif">Historik</h2>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                  
                  <Button 
                    onClick={startNewChat}
                    className="w-full h-14 bg-amber-950 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] mb-8"
                  >
                    <Plus className="w-4 h-4" /> Ny Samtale
                  </Button>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {conversations.map(conv => (
                        <div 
                            key={conv.id}
                            onClick={() => { setActiveConversationId(conv.id); setIsMobileSidebarOpen(false); }}
                            className={`p-4 rounded-2x flex items-center justify-between gap-3 ${activeConversationId === conv.id ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                                    {personas.find(p => p.id === conv.persona)?.icon && React.createElement(personas.find(p => p.id === conv.persona)!.icon, { className: 'w-5 h-5' })}
                                </div>
                                <span className="text-xs font-black text-amber-950 truncate">{conv.title}</span>
                            </div>
                            <Trash2 
                                onClick={(e) => deleteConversation(conv.id, e)} 
                                className="w-4 h-4 text-slate-300 hover:text-rose-500 shrink-0" 
                            />
                        </div>
                    ))}
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(69, 26, 3, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(69, 26, 3, 0.1);
        }
      `}</style>
    </div>
  );
};

export default UnifiedChatPage;
