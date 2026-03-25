'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  where,
  limit
} from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  Clock, 
  Shield, 
  Power, 
  Loader2, 
  ChevronRight, 
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: any;
  status: 'active' | 'archived';
  isReadByAdmin: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAdmin: boolean;
}

export default function AdminChatPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isSettingStatus, setIsSettingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [lastUnreadCount, setLastUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notification
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, []);

  // 1. Listen to Global Online Status
  useEffect(() => {
    if (!firestore) return;
    const statusRef = doc(firestore, 'site_config', 'chat');
    return onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsOnline(docSnap.data().isOnline);
      }
    }, (err) => {
      console.error('[AdminChat] Online status listener error:', err);
    });
  }, [firestore]);

  // 2. Listen to Chat Sessions
  useEffect(() => {
    if (!firestore) return;
    const sessionsRef = collection(firestore, 'support_chats');
    let q = query(sessionsRef, orderBy('lastMessageAt', 'desc'), limit(100));
    if (filterStatus !== 'all') {
      q = query(sessionsRef, where('status', '==', filterStatus), orderBy('lastMessageAt', 'desc'), limit(100));
    }
    
    return onSnapshot(q, (snapshot) => {
      const activeSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(activeSessions);

      // Notification logic
      const unreadCount = activeSessions.filter(s => !s.isReadByAdmin).length;
      if (unreadCount > lastUnreadCount) {
        // Only notify if it's a message from User (not from Admin reply)
        // Check the latest message in the unread sessions (if needed, or just play)
        audioRef.current?.play().catch(e => console.log('Audio blocked:', e));
        
        if ("Notification" in window && Notification.permission === "granted") {
            const latestSession = activeSessions.find(s => !s.isReadByAdmin);
            if (latestSession) {
               new Notification("Ny Chat Besked", { 
                  body: `${latestSession.userName}: ${latestSession.lastMessage}`,
                  icon: '/favicon.ico'
               });
            }
        }
      }
      setLastUnreadCount(unreadCount);
    }, (err) => {
      console.error('[AdminChat] Sessions listener error:', err);
    });
  }, [firestore, filterStatus, lastUnreadCount]);

  // 3. Listen to messages for selected session
  useEffect(() => {
    if (!firestore || !selectedSession) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(firestore, 'support_chats', selectedSession.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      scrollToBottom();
      
      // Mark as read if not already
      if (!selectedSession.isReadByAdmin) {
        updateDoc(doc(firestore, 'support_chats', selectedSession.id), {
          isReadByAdmin: true
        });
      }
    }, (err) => {
      console.error('[AdminChat] Messages listener error:', err);
    });

    return () => unsubscribe();
  }, [firestore, selectedSession]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleToggleOnlineStatus = async () => {
    if (!firestore || isSettingStatus) return;
    setIsSettingStatus(true);
    try {
      const statusRef = doc(firestore, 'site_config', 'chat');
      await setDoc(statusRef, { isOnline: !isOnline }, { merge: true });
      toast({
        title: !isOnline ? 'Chatten er nu ONLINE' : 'Chatten er nu OFFLINE',
        description: !isOnline ? 'Brugere kan nu chatte med dig live.' : 'Brugere får at vide du ikke er online.',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettingStatus(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !firestore || !selectedSession || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const messagesRef = collection(firestore, 'support_chats', selectedSession.id, 'messages');
      await addDoc(messagesRef, {
        text: textToSend,
        senderId: 'admin',
        senderName: 'Cohéro Support',
        createdAt: serverTimestamp(),
        isAdmin: true
      });

      await updateDoc(doc(firestore, 'support_chats', selectedSession.id), {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        isReadByAdmin: true
      });

      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleArchiveSession = async (sessionId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'support_chats', sessionId), {
        status: 'archived'
      });
      setSelectedSession(null);
      toast({
        title: 'Sag lukket',
        description: 'Samtalen er blevet flyttet til arkivet.',
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke lukke sagen.',
      });
    }
  };

  const handleMarkAsDone = async (sessionId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'support_chats', sessionId), {
        status: 'archived'
      });
      setSelectedSession(null);
      toast({
        title: 'Markeret som færdig',
        description: 'Sagen er nu løst og arkiveret.',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden gap-8 animate-ink">
      
      {/* SIDEBAR: Session List */}
      <div className="w-96 flex flex-col bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        
        {/* Sidebar Header */}
        <div className="p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 serif">Samtaler</h3>
              <button 
                onClick={handleToggleOnlineStatus}
                disabled={isSettingStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isOnline 
                    ? 'bg-emerald-100 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isSettingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                {isOnline ? 'Online' : 'Offline'}
              </button>
           </div>

           <div className="flex gap-2 p-1 bg-slate-100 rounded-3xl">
              <button 
                onClick={() => setFilterStatus('active')}
                className={`flex-1 py-3 px-2 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'active' ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:text-amber-950 hover:bg-white'}`}
              >
                Aktive
              </button>
              <button 
                onClick={() => setFilterStatus('archived')}
                className={`flex-1 py-3 px-2 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'archived' ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:text-amber-950 hover:bg-white'}`}
              >
                Arkiv
              </button>
              <button 
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-3 px-2 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:text-amber-950 hover:bg-white'}`}
              >
                Alle
              </button>
           </div>

           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
              <input 
                type="text" 
                placeholder="Søg i samtaler..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all outline-none"
              />
           </div>
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
           {filteredSessions.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Ingen chats fundet</p>
             </div>
           ) : (
             filteredSessions.map((session) => (
               <button
                 key={session.id}
                 onClick={() => setSelectedSession(session)}
                 className={`w-full p-5 rounded-2xl text-left transition-all border group relative ${
                   selectedSession?.id === session.id 
                     ? 'bg-amber-950 border-amber-950 text-white shadow-xl shadow-amber-950/20' 
                     : 'bg-white border-transparent hover:border-slate-200 text-slate-600 shadow-sm'
                 }`}
               >
                 <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      selectedSession?.id === session.id ? 'bg-white/10 text-amber-400' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-bold text-sm truncate leading-none mb-1.5">{session.userName || 'Gæst'}</p>
                       <p className={`text-[10px] truncate opacity-60 font-medium ${selectedSession?.id === session.id ? 'text-white' : 'text-slate-400'}`}>
                          {session.userEmail || 'Ingen email'}
                       </p>
                    </div>
                    {!session.isReadByAdmin && (
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm" />
                    )}
                 </div>
                 <p className={`text-xs truncate font-medium ${selectedSession?.id === session.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {session.lastMessage}
                 </p>
                 <div className={`flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest ${selectedSession?.id === session.id ? 'text-amber-400/70' : 'text-slate-300'}`}>
                    <Clock className="w-3 h-3" />
                    {session.lastMessageAt ? new Date(session.lastMessageAt.toDate()).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : '...'}
                 </div>
               </button>
             ))
           )}
        </div>
      </div>

      {/* MAIN: Chat Window */}
      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         
         {selectedSession ? (
           <>
              {/* Chat Header */}
              <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] z-10">
                 <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-amber-950 shadow-sm overflow-hidden">
                        {selectedSession.userEmail ? (
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedSession.userName}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 opacity-20" />
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${selectedSession.userEmail !== 'Ingen email' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                         <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div>
                       <div className="flex items-center gap-3 mb-1.5">
                          <h4 className="text-2xl font-black text-slate-900 serif leading-none">{selectedSession.userName || 'Gæst'}</h4>
                          {selectedSession.userEmail !== 'Ingen email' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200/50">Student</span>
                          )}
                       </div>
                       <div className="flex items-center gap-3">
                          <p className="text-[13px] font-bold text-slate-400">{selectedSession.userEmail}</p>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <p className="text-[10px] font-black uppercase text-amber-900/40 tracking-wider">ID: {selectedSession.id.slice(0, 8)}...</p>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {selectedSession.status === 'archived' ? (
                      <button 
                        onClick={async () => {
                          if (!firestore) return;
                          await updateDoc(doc(firestore, 'support_chats', selectedSession.id), { status: 'active' });
                          setSelectedSession(null);
                          toast({ title: 'Sag genåbnet', description: 'Samtalen er nu aktiv igen.' });
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-amber-950 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-950/20 hover:scale-105 active:scale-95 transition-all"
                      >
                         <MessageSquare className="w-4 h-4" />
                         Genåbn sag
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleArchiveSession(selectedSession.id)}
                          className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Luk
                        </button>
                        <button 
                          onClick={() => handleMarkAsDone(selectedSession.id)}
                          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Markér som færdig
                        </button>
                      </>
                    )}
                  </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-[url('/grid.svg')] bg-[length:40px_40px] bg-slate-50/50">
                 {messages.map((msg, idx) => {
                   const isMe = msg.isAdmin;
                   const time = msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : '...';
                   
                   return (
                     <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] group relative`}>
                           <div className={`p-6 rounded-[2.5rem] shadow-sm text-[14px] font-medium leading-relaxed border ${
                             isMe 
                               ? 'bg-amber-950 text-white border-amber-950 rounded-tr-none' 
                               : 'bg-white text-slate-600 border-slate-100 rounded-tl-none shadow-md shadow-slate-200/50'
                           }`}>
                              {msg.text}
                           </div>
                           <div className={`flex items-center gap-3 mt-3 px-4 ${isMe ? 'justify-end' : 'justify-start opacity-40'}`}>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {time}
                              </p>
                              {!isMe && <p className="text-[9px] font-black uppercase tracking-widest text-amber-950/40">Af {msg.senderName}</p>}
                           </div>
                        </div>
                     </div>
                   );
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.05)]">
                 <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-end gap-5">
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-1 transition-all focus-within:ring-8 focus-within:ring-amber-950/5 focus-within:border-amber-950/20">
                       <textarea 
                         value={inputText}
                         onChange={(e) => setInputText(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             handleSendMessage();
                           }
                         }}
                         placeholder="Skriv dit svar..." 
                         className="w-full bg-transparent border-none px-6 py-4 text-sm font-medium transition-all outline-none resize-none min-h-[60px] max-h-[200px]"
                         rows={1}
                       />
                    </div>
                    <button 
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className={`h-[60px] w-[60px] rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl shrink-0 ${
                        !inputText.trim() || isSending 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-amber-950 text-amber-400 hover:scale-105 active:scale-95 shadow-amber-950/30'
                      }`}
                    >
                      {isSending ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
                    </button>
                 </form>
              </div>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-slate-50/10">
              <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-950/20 mb-8 border border-amber-100/50 shadow-inner">
                 <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 serif mb-4">Support Dashboard</h3>
              <p className="text-slate-500 max-w-md font-medium leading-relaxed">
                 Vælg en samtale fra listen til venstre for at starte hjælpen. <br/>
                 Husk at sætte din status til <span className="text-emerald-600 font-bold uppercase tracking-wider">Online</span> for at modtage nye henvendelser.
              </p>
              
              <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ubesvarede</p>
                    <p className="text-3xl font-black text-slate-900">{sessions.filter(s => !s.isReadByAdmin).length}</p>
                 </div>
                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Aktive i dag</p>
                    <p className="text-3xl font-black text-slate-900">{sessions.length}</p>
                 </div>
              </div>
           </div>
         )}
      </div>

    </div>
  );
}
