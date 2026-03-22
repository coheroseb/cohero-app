'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCircle,
  FolderOpen,
  FastForward,
  Reply
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

import { simulateStartAction, simulateNextDayAction, simulateFeedbackAction } from '@/app/actions';

// -- Subcomponents --
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

const SourceIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
        case 'email': return <Mail className={className} />;
        case 'phone': return <Phone className={className} />;
        case 'sms': return <MessageSquare className={className} />;
        case 'note': return <FileText className={className} />;
        default: return <FileText className={className} />;
    }
};

const getFormatDateStr = (d = new Date()) => d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const getShortDateStr = (d = new Date()) => d.toLocaleString('da-DK', { hour: '2-digit', minute:'2-digit', day:'numeric', month:'short' });

export default function PageClient() {
  const router = useRouter();
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();

  const simDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'activeSimulation', 'current') : null, [user, firestore]);
  const { data: simulation, isLoading: isSimLoading } = useDoc<any>(simDocRef);

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('Blandede Socialsager');
  
  const [activeView, setActiveView] = useState<'inbox' | 'case' | 'feedback'>('inbox');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const [journalInputs, setJournalInputs] = useState<Record<string, string>>({});
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  useEffect(() => {
    if (simulation?.journals) {
        setJournalInputs(simulation.journals);
    }
  }, [simulation?.journals]);

  // -- Real-Time Check Logic --
  useEffect(() => {
      if (!simulation || simulation.status !== 'active' || isGenerating || !simDocRef || !user) return;
      
      const checkRealTime = async () => {
          if (!simulation.createdAt) return;
          const startDate = simulation.createdAt.toDate ? simulation.createdAt.toDate() : new Date(simulation.createdAt);
          const now = new Date();
          const diffMs = now.getTime() - startDate.getTime();
          const realDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          
          if (realDay > simulation.currentDay) {
              const daysPassed = realDay - simulation.currentDay;
              setIsGenerating(true);
              toast({ title: "Tid er gået", description: `Der er gået ${daysPassed} dag(e) siden du sidst tjekkede sagerne. Opdaterer indbakken...` });
              
              try {
                  // Push the journal state before progressing
                  await updateDoc(simDocRef, { journals: journalInputs, updatedAt: serverTimestamp() });
                  
                  const res = await simulateNextDayAction({
                      cases: simulation.cases,
                      previousInbox: simulation.inbox,
                      userJournals: journalInputs,
                      currentDay: realDay,
                      daysPassed: daysPassed,
                      userName: simulation.userName || userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver',
                      newDateStr: getFormatDateStr(now)
                  });
                  
                  const newInboxEvents = res.data.newEvents.map((i: any) => ({ ...i, isRead: false }));
                  
                  await updateDoc(simDocRef, {
                      currentDay: realDay,
                      inbox: [...simulation.inbox, ...newInboxEvents],
                      updatedAt: serverTimestamp()
                  });
                  
                  toast({ title: `Ny Dato: ${getFormatDateStr(now)}`, description: `Du har fået ${newInboxEvents.length} nye hændelser.` });
                  
              } catch (e) {
                  console.error(e);
                  toast({ title: "Fejl ved auto-sync", description: "Kunne ikke hente nye hændelser.", variant: 'destructive' });
              } finally {
                  setIsGenerating(false);
              }
          }
      };
      
      checkRealTime();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation?.currentDay, simulation?.status, simDocRef, user]);


  const handleStartSim = async () => {
    if (!user || !firestore || !simDocRef || isGenerating) return;
    setIsGenerating(true);
    try {
        const userName = userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver';
        const currentDateStr = getFormatDateStr();
        const res = await simulateStartAction({ theme: selectedTopic, userName, currentDateStr });
        const newSim = {
            status: 'active',
            userName,
            currentDay: 1,
            cases: res.data.cases,
            inbox: res.data.inbox.map((i: any) => ({ ...i, isRead: false })),
            journals: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(simDocRef, newSim);
        toast({ title: 'Simulation Startet', description: 'Du har fået nye sager på dit skrivebord.' });
        setActiveView('inbox');
    } catch (e) {
        console.error(e);
        toast({ title: 'Fejl', description: 'Kunne ikke starte simulationen.', variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleEndSimulation = async () => {
    if (!simulation || !user || !firestore || !simDocRef || isGenerating) return;
    if (!window.confirm("Er du sikker på at du vil afslutte simulationen nu? Din indsats vil blive evalueret.")) return;
    
    setIsGenerating(true);
    try {
        await updateDoc(simDocRef, { journals: journalInputs, updatedAt: serverTimestamp() });
        
        const res = await simulateFeedbackAction({
            cases: simulation.cases,
            inbox: simulation.inbox,
            userJournals: journalInputs,
            totalDays: simulation.currentDay,
            userName: simulation.userName || userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver'
        });
        
        await updateDoc(simDocRef, {
            status: 'completed',
            feedback: res.data,
            updatedAt: serverTimestamp()
        });
        
        toast({ title: 'Simulation Afsluttet', description: 'Din evaluering er klar.' });
        setActiveView('feedback');
    } catch(e) {
        console.error(e);
        toast({ title: 'Fejl', description: 'Kunne ikke afslutte simulationen.', variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  };

  const markAsRead = async (id: string) => {
      if(!simulation || !simDocRef) return;
      const updatedInbox = simulation.inbox.map((i: any) => i.id === id ? { ...i, isRead: true } : i);
      setDoc(simDocRef, { inbox: updatedInbox }, { merge: true });
  };
  
  const handleSendReply = async (eventId: string, relatedCaseId: string, originalTitle: string) => {
      if (!replyContent.trim() || !simulation || !simDocRef) return;
      
      const userName = simulation.userName || userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver';
      const newEvent = {
          id: `evt_reply_${Date.now()}`,
          relatedCaseId,
          type: 'email',
          sender: userName,
          date: getShortDateStr(),
          title: originalTitle.startsWith('SV:') ? originalTitle : `SV: ${originalTitle}`,
          content: replyContent,
          isRead: true
      };
      
      const prevInbox = simulation.inbox || [];
      await updateDoc(simDocRef, {
          inbox: [...prevInbox, newEvent],
          updatedAt: serverTimestamp()
      });
      
      setReplyingTo(null);
      setReplyContent('');
      toast({ title: 'Svar Sendt', description: 'Beskeden indgår nu i sagens akter og læses af modparten.' });
  };
  
  // Dev-Tool: Fast Forward Time
  const fastForwardDevTool = async () => {
      if (!simulation || !simDocRef || !simulation.createdAt) return;
      if (!window.confirm("DEV TOOL: Dette vil rykke spillets start-dato 24 timer tilbage i databasen for at simulere, at der er gået en dag. Fortsæt?")) return;
      
      const oldDate = simulation.createdAt.toDate ? simulation.createdAt.toDate() : new Date(simulation.createdAt);
      // subtract 24 hours
      const newDate = new Date(oldDate.getTime() - (24 * 60 * 60 * 1000));
      await updateDoc(simDocRef, { createdAt: newDate });
      toast({ title: "Tid spulet frem", description: "Genindlæs eventuelt siden, eller vent et sekund på at auto-sync fanger det." });
  };

  if (isSimLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  const showStartScreen = !simulation || simulation.status === 'not-started';
  const isCompleted = simulation?.status === 'completed';
  
  const unreadCount = simulation?.inbox?.filter((i: any) => !i.isRead).length || 0;
  
  // UI helpers for replying
  const renderReplyBox = (item: any) => {
      if (replyingTo !== item.id) return null;
      return (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              <Textarea 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Skriv dit svar her..."
                  className="w-full bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-xl mb-3 text-sm"
              />
              <div className="flex items-center gap-2">
                  <Button onClick={() => handleSendReply(item.id, item.relatedCaseId, item.title)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 px-4 text-xs font-bold shadow-sm">
                      Send svar
                  </Button>
                  <Button variant="ghost" onClick={() => { setReplyingTo(null); setReplyContent(''); }} className="text-slate-500 rounded-lg h-9 px-4 text-xs font-bold hover:bg-slate-100">
                      Fortryd
                  </Button>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex overflow-hidden text-slate-800">
        
        {showStartScreen ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
                <div className="max-w-xl text-center space-y-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 outline outline-8 outline-white rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl">
                        <FolderOpen className="w-12 h-12" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Sags-simulator</h1>
                    <p className="text-lg text-slate-500 font-medium">
                        Træd ind i rollen som socialrådgiver. Tiden i spillet følger virkeligheden. Beslut dig, journalisér, og kom tilbage i morgen for at se konsekvenserne.
                    </p>
                    
                    <div className="pt-8">
                        <Button 
                            onClick={handleStartSim} 
                            disabled={isGenerating}
                            className="h-16 px-12 text-lg rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all w-full max-w-sm"
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3 text-amber-400" />}
                            Start Første Arbejdsdag
                        </Button>
                    </div>
                </div>
            </div>
        ) : (
            <>
                {/* SIDEBAR */}
                <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl relative">
                    <div className="min-h-24 flex flex-col justify-center px-6 border-b border-slate-100 shrink-0 py-4">
                        <div className="flex items-center mb-1">
                            <button onClick={() => router.back()} className="mr-3 text-slate-400 hover:text-slate-800 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="font-black text-slate-900 text-lg">Skrivebord</h2>
                        </div>
                        <div className="flex items-center gap-2 pl-8">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 truncate">{getFormatDateStr(simulation.updatedAt?.toDate ? simulation.updatedAt.toDate() : new Date())}</p>
                        </div>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 pb-24 custom-scrollbar space-y-8">
                        
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-widest">Kommunikation</h3>
                            <button 
                                onClick={() => { setActiveView('inbox'); setSelectedItem(null); }}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${activeView === 'inbox' ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm font-bold">Indbakke</span>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
                                )}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-widest">Aktive Sager</h3>
                            {simulation.cases?.map((c: any) => (
                                <button 
                                    key={c.id}
                                    onClick={() => { setActiveView('case'); setSelectedItem(c.id); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${activeView === 'case' && selectedItem === c.id ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'border-transparent hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <h4 className="text-sm font-bold truncate pr-4">{c.id}: {c.title}</h4>
                                    <p className="text-[10px] text-slate-400 truncate mt-1">{c.topic}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-50 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-500 font-medium mb-4 flex justify-center items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                Vender tilbage i morgen for nye begivenheder.
                            </p>
                            <Button 
                                variant="outline"
                                onClick={handleEndSimulation} 
                                className="w-full text-xs font-bold bg-white text-slate-600 border-slate-200 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors rounded-xl"
                            >
                                Afslut simulation & Evaluer
                            </Button>
                            
                            {/* Dev tool - Fast forward 24 hours */}
                            <button onClick={fastForwardDevTool} className="mt-4 text-[9px] text-slate-300 hover:text-indigo-400 uppercase tracking-widest font-black flex items-center justify-center w-full gap-1 transition-colors">
                                <FastForward className="w-3 h-3" /> Dev: Spol 24 timer frem
                            </button>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative">
                    
                    {/* INBOX VIEW */}
                    {activeView === 'inbox' && (
                        <div className="p-10 max-w-4xl max-w-5xl mx-auto w-full">
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                                Indbakke 
                                {isGenerating && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 text-indigo-800">
                                <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                                <b>Guide:</b> Læs og journaliser alle hændelser på sagerne. Du kan også besvare e-mails direkte. Kom tilbage i morgen – for the hændelser du modtager da, er direkte konsekvenser af dine vurderinger og svar!
                            </p>
                            <div className="space-y-4">
                                {simulation.inbox?.sort((a: any, b: any) => b.id.localeCompare(a.id)).map((item: any) => {
                                    const isUserMessage = item.sender === (simulation.userName || userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver');
                                    
                                    return (
                                    <div 
                                        key={item.id}
                                        onClick={() => !item.isRead && markAsRead(item.id)}
                                        className={`bg-white rounded-2xl p-6 border transition-all ${!item.isRead ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50 cursor-pointer hover:border-indigo-300' : 'border-slate-100 shadow-sm'} ${isUserMessage ? 'ml-12 border-emerald-100 bg-emerald-50/20' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isUserMessage ? 'bg-emerald-100 text-emerald-600' : (!item.isRead ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400')}`}>
                                                <SourceIcon type={item.type} className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`text-base flex items-center gap-2 ${!item.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                                        {item.title}
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{item.date}</span>
                                                </div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                                        <UserCircle className="w-3 h-3" /> Fra: {isUserMessage ? 'Dig' : item.sender}
                                                        <span className="mx-2">•</span>
                                                        Vedr. sag: <span className="text-indigo-600 font-bold ml-1">{item.relatedCaseId}</span>
                                                    </p>
                                                    
                                                    {['email', 'sms'].includes(item.type) && !isUserMessage && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === item.id ? null : item.id); }}
                                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                                                        >
                                                            <Reply className="w-3 h-3" /> Besvar
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed font-serif relative">
                                                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isUserMessage ? 'bg-emerald-300' : 'bg-slate-200'}`}></div>
                                                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                                                </div>
                                                
                                                {renderReplyBox(item)}
                                            </div>
                                        </div>
                                    </div>
                                )})}

                                {simulation.inbox?.length === 0 && !isGenerating && (
                                    <p className="text-slate-400 text-center py-20 font-medium">Indbakken er tom.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CASE VIEW */}
                    {activeView === 'case' && selectedItem && (() => {
                        const currentCase = simulation.cases.find((c: any) => c.id === selectedItem);
                        const caseHistory = simulation.inbox.filter((i: any) => i.relatedCaseId === selectedItem);
                        
                        return (
                            <div className="h-full flex flex-col lg:flex-row p-6 gap-6 w-full max-w-[1600px] mx-auto">
                                
                                {/* Case Info & History */}
                                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{currentCase?.id}</span>
                                            <span className="text-xs font-bold text-slate-400">{currentCase?.topic}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentCase?.title}</h2>
                                        <p className="text-sm text-slate-600 mt-4 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{currentCase?.description}</p>
                                    </div>
                                    
                                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Sagens historik ({caseHistory.length})</h3>
                                        <div className="space-y-6">
                                            {caseHistory.map((item: any) => {
                                                const isUserMessage = item.sender === (simulation.userName || userProfile?.username || user?.displayName?.split(' ')[0] || 'Socialrådgiver');
                                                
                                                return (
                                                <div key={item.id} className={`flex gap-4 ${isUserMessage ? 'ml-8' : ''}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUserMessage ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        <SourceIcon type={item.type} className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed font-medium relative ${isUserMessage ? 'bg-emerald-50 text-emerald-900 border border-emerald-100/50' : 'bg-slate-50 text-slate-700'}`}>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                                    {isUserMessage ? 'Dig' : item.sender}
                                                                </span>
                                                                <div className="flex items-center gap-3">
                                                                    {['email', 'sms'].includes(item.type) && !isUserMessage && (
                                                                        <button 
                                                                            onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                                                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                                        >
                                                                            Besvar
                                                                        </button>
                                                                    )}
                                                                    <span className="text-[10px] text-slate-400 font-bold">{item.date}</span>
                                                                </div>
                                                            </div>
                                                            <div dangerouslySetInnerHTML={{ __html: item.content }} className="font-serif" />
                                                        </div>
                                                        {renderReplyBox(item)}
                                                    </div>
                                                </div>
                                            )})}
                                            {caseHistory.length === 0 && <p className="text-sm text-slate-400 italic">Ingen historik på sagen endnu.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Journal Editor */}
                                <div className="w-full lg:w-[500px] xl:w-[600px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-amber-400" /> Sagsjournal
                                        </h3>
                                        {isCompleted && <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Afsluttet</span>}
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col relative bg-amber-50/10">
                                        <Textarea
                                            disabled={isCompleted}
                                            value={journalInputs[currentCase?.id] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setJournalInputs(prev => {
                                                    const updated = { ...prev, [currentCase.id]: val };
                                                    // optionally auto-save debounced here, currently saving on progress/end
                                                    return updated;
                                                });
                                                // Sync to firestore on every keypress might be heavy, so we rely on updates triggering on events
                                                updateDoc(simDocRef!, { journals: { ...journalInputs, [currentCase.id]: val }, updatedAt: serverTimestamp() });
                                            }}
                                            placeholder="Skriv dit journalnotat her. Hvad har du vurderet? Hvem har du involveret? Hvad er næste skridt i sagen?"
                                            className="w-full flex-1 border-none bg-transparent resize-none p-0 focus-visible:ring-0 text-slate-800 text-base leading-relaxed font-medium placeholder:text-slate-300"
                                        />
                                        {!isCompleted && (
                                            <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                    Dine notater autosaves og læses af AI'en næste dag.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })()}

                    {/* FEEDBACK VIEW (GAME OVER) */}
                    {activeView === 'feedback' && simulation.feedback && (
                        <div className="p-10 max-w-4xl mx-auto w-full space-y-12">
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Evaluering</h2>
                                <p className="text-slate-500 font-medium text-lg">Dit arbejde over de seneste {simulation.currentDay} dage er nu bedømt.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <GlassCard className="p-8 text-center bg-white">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Tidsstyring</p>
                                    <div className="text-5xl font-black text-indigo-600 mb-2">{simulation.feedback.timeManagementScore}<span className="text-xl text-slate-300">/10</span></div>
                                </GlassCard>
                                <GlassCard className="p-8 text-center bg-white border-2 border-amber-100 scale-105 shadow-xl">
                                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-3">Samlet Score</p>
                                    <div className="text-6xl font-black text-amber-950 mb-2">{simulation.feedback.overallScore}</div>
                                </GlassCard>
                                <GlassCard className="p-8 text-center bg-white">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Faglig Syntese</p>
                                    <div className="text-5xl font-black text-emerald-600 mb-2">{simulation.feedback.synthesisScore}<span className="text-xl text-slate-300">/10</span></div>
                                </GlassCard>
                            </div>

                            <GlassCard className="p-10 bg-white">
                                <h3 className="text-xl font-black text-slate-900 mb-4">Generel Feedback</h3>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: simulation.feedback.generalFeedback }} />
                            </GlassCard>

                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900">Sags-specifik Evaluering</h3>
                                {simulation.feedback.caseSpecificFeedback?.map((c: any) => (
                                    <GlassCard key={c.caseId} className="p-8 bg-slate-50/50">
                                        <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                            <FolderOpen className="w-5 h-5 text-indigo-500" /> Sag: {c.caseId}
                                        </h4>
                                        <p className="text-slate-700 leading-relaxed font-medium text-sm">{c.feedbackText}</p>
                                    </GlassCard>
                                ))}
                            </div>
                            
                            <div className="pb-24 pt-8 text-center">
                                <Button onClick={() => { setDoc(simDocRef!, { status: 'not-started' }); setActiveView('inbox'); }} className="h-14 px-8 rounded-2xl bg-slate-900 text-white">
                                    Spil igen
                                </Button>
                            </div>
                        </div>
                    )}

                </main>
            </>
        )}
    </div>
  );
}
