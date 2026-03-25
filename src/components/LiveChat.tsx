'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Minus, Trash2, Smile, Paperclip, Loader2 } from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAdmin: boolean;
}

export default function LiveChat() {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Session & Online Status
  useEffect(() => {
    if (!firestore) return;

    // Listen to global online status
    const statusRef = doc(firestore, 'site_config', 'chat');
      const unsubscribeStatus = onSnapshot(statusRef, (docSnap) => {
        if (docSnap.exists()) {
          setIsOnline(!!docSnap.data().isOnline);
        } else {
          setIsOnline(false);
        }
      }, (err) => {
        console.error('Support Chat status error:', err);
      });

    // Handle Session ID
    let currentSessionId = '';
    if (user) {
      currentSessionId = user.uid;
    } else {
      const stored = localStorage.getItem('cohero_chat_session');
      if (stored) {
        currentSessionId = stored;
      } else {
        currentSessionId = `guest_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('cohero_chat_session', currentSessionId);
      }
    }
    setSessionId(currentSessionId);

    return () => unsubscribeStatus();
  }, [firestore, user]);

  // 2. Listen to Messages
  useEffect(() => {
    if (!firestore || !sessionId || !isOpen) return;

    const messagesRef = collection(firestore, 'support_chats', sessionId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      scrollToBottom();
    }, (err) => {
      console.error('[LiveChat] Messages listener error:', err);
    });

    return () => unsubscribeMessages();
  }, [firestore, sessionId, isOpen]);

  // 3. Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 4. Handle Send
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !firestore || !sessionId || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      // a. Add message to subcollection
      const messagesRef = collection(firestore, 'support_chats', sessionId, 'messages');
      await addDoc(messagesRef, {
        text: textToSend,
        senderId: sessionId,
        senderName: user?.displayName || 'Gæst',
        createdAt: serverTimestamp(),
        isAdmin: false
      });

      // b. Update/Create session document for admin overview
      const sessionRef = doc(firestore, 'support_chats', sessionId);
      await setDoc(sessionRef, {
        userId: sessionId,
        userName: user?.displayName || 'Gæst',
        userEmail: user?.email || 'Ingen email',
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        status: 'active',
        isReadByAdmin: false
      }, { merge: true });

      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // If chat is not open, only show the bubble
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[130] w-14 h-14 bg-amber-950 rounded-full flex items-center justify-center text-amber-400 shadow-2xl hover:bg-amber-900 transition-all group"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          {isOnline && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-amber-950 rounded-full animate-pulse shadow-lg" />
          )}
        </div>
        
        {/* Hover Label */}
        <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap">
           <p className="text-xs font-bold text-slate-800">
             {isOnline ? 'Chat med os 👋' : 'Vi er dsv. offline nu'}
           </p>
        </div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ 
          y: isMinimized ? 500 : 0, 
          opacity: 1, 
          scale: 1 
        }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[140] w-[350px] max-w-[90vw] h-[550px] max-h-[80vh] bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden"
        style={{ pointerEvents: isMinimized ? 'none' : 'auto' }}
      >
        {/* Header */}
        <div className="p-4 bg-amber-950 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
                <ShieldIcon className="w-5 h-5" />
             </div>
             <div>
                <h4 className="font-bold text-sm leading-none serif">Kundesupport</h4>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                     {isOnline ? 'Vi er online' : 'Vi er offline'}
                   </span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <Minus className="w-4 h-4" />
             </button>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-white">
                <X className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
           
           {!isOnline && messages.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                   <MessageSquare className="w-8 h-8 opacity-40" />
                </div>
                <h5 className="font-bold text-slate-800 text-lg serif">Vi er ikke online lige nu</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                   Vores support team er ikke ved computeren lige nu, men du er velkommen til at skrive alligevel - så svarer vi så snart vi er tilbage!
                </p>
             </div>
           ) : (
             <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {/* Welcome Message */}
                <div className="flex justify-start">
                   <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%]">
                      <p className="text-xs font-bold text-amber-900 mb-1">Cohéro Support</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium capitalize">
                         Hej! Hvordan kan jeg hjælpe dig i dag?
                      </p>
                   </div>
                </div>

                {/* Actual Messages */}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === sessionId;
                  const time = msg.createdAt?.toDate ? 
                    msg.createdAt.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : 
                    new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <motion.div 
                      key={msg.id || idx} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {!isMe && <p className="text-[9px] font-black uppercase text-amber-900 mb-1 ml-1 leading-none tracking-widest">{msg.senderName}</p>}
                      <div className={`p-4 rounded-[1.25rem] shadow-sm max-w-[85%] text-[13px] font-medium leading-relaxed relative group ${
                        isMe 
                          ? 'bg-amber-950 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'
                      }`}>
                         {msg.text}
                         <div className={`absolute bottom-1 ${isMe ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-40 transition-opacity text-[8px] font-bold`}>
                            {time}
                         </div>
                      </div>
                      <span className={`text-[8px] mt-1 font-bold text-slate-400 opacity-60 ${isMe ? 'mr-1' : 'ml-1'}`}>{time}</span>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
             </div>
           )}

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-slate-100/60 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.05)]">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-end gap-3">
                 <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-1 transition-all focus-within:ring-4 focus-within:ring-amber-950/5 focus-within:border-amber-950/20">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onFocus={() => isMinimized && setIsMinimized(false)}
                      placeholder="Skriv din besked her..."
                      className="w-full bg-transparent border-none px-4 py-3 text-[13px] font-medium transition-all outline-none resize-none min-h-[48px] max-h-[120px]"
                      rows={1}
                    />
                 </div>
                 <button 
                   type="submit"
                   disabled={!inputText.trim() || isSending}
                   className={`h-12 w-12 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                     !inputText.trim() || isSending 
                       ? 'bg-slate-100 text-slate-300' 
                       : 'bg-amber-950 text-amber-400 hover:scale-105 active:scale-95 shadow-amber-950/20'
                    }`}
                 >
                   {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 </button>
              </form>
              <div className="flex items-center justify-between mt-3 px-1">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                    Svarer normalt indenfor {isOnline ? 'få minutter' : '24 timer'}
                 </p>
                 <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-amber-950/20 rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cohéro Live</p>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Minimized Bubble Indicator */}
      {isMinimized && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-[150] bg-white border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer hover:border-amber-900/30 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400">
             <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-left pr-4">
             <p className="text-xs font-bold text-slate-800 leading-none mb-1">Besked minimeret</p>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Klik for at udvide</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white absolute -top-2 -right-2">!</div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
