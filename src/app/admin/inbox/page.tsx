'use client';

/**
 * @fileOverview A premium 'Support Hero' inbox for Admin, integrated with Simply.com.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Search, 
  RefreshCw, 
  Inbox, 
  User, 
  CalendarDays, 
  Trash2, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  Sparkles,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { fetchEmails, sendEmailReply, deleteEmail, analyzeInbox, generateReplyDraft, markAsRead } from './actions';
import { useApp } from '@/app/provider';

export default function InboxPage() {
    const { user } = useApp();
    const [emails, setEmails] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [replyContent, setReplyContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    // AI Analysis State
    const [inboxAnalysis, setInboxAnalysis] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAiPulse, setShowAiPulse] = useState(false);
    
    const [isDrafting, setIsDrafting] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

    const loadInbox = async () => {
        setIsLoading(true);
        const mails = await fetchEmails(30);
        setEmails(mails);
        setIsLoading(false);
    };

    useEffect(() => {
        loadInbox();
    }, []);

    const filteredEmails = emails.filter(e => 
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendReply = async () => {
        if (!selectedEmail || !replyContent) return;
        setIsSending(true);
        const res = await sendEmailReply(selectedEmail.from, selectedEmail.subject, replyContent);
        if (res.success) {
            setStatus("Besked sendt!");
            setReplyContent("");
            setTimeout(() => setStatus(null), 3000);
        } else {
            setStatus("Fejl ved afsendelse");
        }
        setIsSending(false);
    };

    const handleDelete = async (uid: string) => {
        if (!confirm("Vil du slette denne besked?!")) return;
        setIsLoading(true);
        const res = await deleteEmail(uid);
        if (res.success) {
            setEmails(prev => prev.filter(e => e.id !== uid));
            setSelectedEmail(null);
            setStatus("Besked slettet!");
            setTimeout(() => setStatus(null), 3000);
        } else {
            setStatus("Kunne ikke slette");
        }
        setIsLoading(false);
    };

    // If user is not admin, we could redirect here, but for now we'll assume they 
    // are allowed if they can reach this page (which should be protected in next.js middleware/layout)

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50/50 rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl relative">
            
            {/* Header / Toolbar */}
            <div className="px-10 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between gap-8 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    {mobileView === 'content' && (
                        <button 
                            onClick={() => setMobileView('list')}
                            className="lg:hidden p-3 bg-slate-100 rounded-xl mr-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 hidden sm:flex">
                        <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 serif">Support Hero Inbox</h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> kontakt@cohero.dk
                        </p>
                    </div>
                </div>

                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Søg i dine mails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none placeholder:text-slate-300"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={async () => {
                            if (emails.length === 0) return;
                            setIsAnalyzing(true);
                            setShowAiPulse(true);
                            const res = await analyzeInbox(emails);
                            setInboxAnalysis(res);
                            setIsAnalyzing(false);
                        }}
                        className="px-6 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-indigo-600/10"
                    >
                        {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">AI Analyse</span>
                    </button>
                    <button 
                        onClick={loadInbox}
                        className="p-4 bg-white border border-slate-100 hover:border-indigo-100 text-slate-400 hover:text-indigo-500 rounded-2xl transition-all active:scale-90"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="w-px h-10 bg-slate-100 mx-2" />
                    <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Master Admin</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* Email List Sidebar */}
                <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex w-full lg:w-96 border-r border-slate-50 bg-white/40 flex-col overflow-hidden`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {isLoading && emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Henter mails...</p>
                            </div>
                        ) : filteredEmails.length > 0 ? (
                            filteredEmails.map((email) => (
                                <motion.div 
                                    key={email.id}
                                    whileHover={{ x: 5 }}
                                    onClick={() => {
                                        setSelectedEmail(email);
                                        setMobileView('content');
                                        if (email.isUnread) {
                                            markAsRead(email.id);
                                            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isUnread: false } : e));
                                        }
                                    }}
                                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedEmail?.id === email.id ? 'bg-indigo-900 border-indigo-900 text-white shadow-xl shadow-indigo-900/20' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl text-[10px] font-black ${selectedEmail?.id === email.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                {email.from.split('<')[0].trim().slice(0, 1).toUpperCase()}
                                            </div>
                                            {email.isUnread && (
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-black ${selectedEmail?.id === email.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                                            {new Date(email.date).toLocaleDateString('da-DK', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <h3 className={`text-sm font-black truncate mb-1 ${selectedEmail?.id === email.id ? 'text-white' : 'text-slate-900'}`}>
                                        {email.subject}
                                    </h3>
                                    <p className={`text-[11px] font-medium leading-relaxed truncate ${selectedEmail?.id === email.id ? 'text-indigo-100/60' : 'text-slate-400'}`}>
                                        {email.from}
                                    </p>

                                    {selectedEmail?.id === email.id && (
                                        <div className="absolute right-6 bottom-6">
                                            <ChevronRight className="w-4 h-4 text-white/40" />
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <Inbox className="w-10 h-10 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Ingen henvendelser</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Content Area */}
                <div className={`${mobileView === 'content' ? 'flex' : 'hidden'} lg:flex flex-1 bg-white/80 overflow-y-auto custom-scrollbar flex-col`}>
                    {selectedEmail ? (
                        <div className="max-w-4xl mx-auto p-12 lg:p-20">
                            
                            {/* Meta Info */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8 pb-12 border-b border-slate-50">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-xl font-black shadow-2xl">
                                        {selectedEmail.from.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 serif leading-tight mb-1">{selectedEmail.from}</h2>
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <p className="text-xs font-medium flex items-center gap-1.5"><Globe className="w-3 h-3" /> Overvejer at skifte til Cohéro</p>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <p className="text-xs font-medium flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> {new Date(selectedEmail.date).toLocaleString('da-DK')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleDelete(selectedEmail.id)}
                                        className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="mb-12">
                                <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-4">Emne</h3>
                                <div className="p-8 bg-indigo-50/20 rounded-[2.5rem] border border-indigo-50/50">
                                    <p className="text-xl font-black text-slate-900 serif">"{selectedEmail.subject}"</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="mb-20">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Besked</h3>
                                <div 
                                    className="text-lg text-slate-600 leading-relaxed serif p-8 bg-white rounded-3xl"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                                />
                            </div>

                            {/* Reply Form */}
                            <div className="bg-slate-900 rounded-[3.5rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                                                <Zap className="w-5 h-5 fill-white" />
                                            </div>
                                            <h4 className="text-xl font-black text-white serif">Hurtigt svar til {selectedEmail.from.split('<')[0]}</h4>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                setIsDrafting(true);
                                                const draft = await generateReplyDraft(selectedEmail);
                                                setReplyContent(draft);
                                                setIsDrafting(false);
                                            }}
                                            disabled={isDrafting}
                                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                                        >
                                            {isDrafting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-white" />}
                                            {isDrafting ? 'Skriver...' : 'Udkast med AI'}
                                        </button>
                                    </div>
                                    <textarea 
                                        rows={6}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Skriv dit svar her..."
                                        className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-white text-lg font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-white/20 transition-all mb-8 resize-none"
                                    />
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic flex items-center gap-2">
                                            <Send className="w-3 h-3" /> Sender via Simply.com (SMTP)
                                        </p>
                                        <button 
                                            onClick={handleSendReply}
                                            disabled={isSending || !replyContent}
                                            className="px-12 py-5 bg-white hover:bg-amber-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all transform active:scale-95 disabled:bg-white/10 disabled:text-white/20 flex items-center gap-3 shadow-xl shadow-white/5"
                                        >
                                            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {isSending ? 'Sender...' : 'Send Svar Nu'}
                                        </button>
                                    </div>
                                </div>
                                {status && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute bottom-10 left-10 p-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest z-20 shadow-2xl border-4 border-slate-900"
                                    >
                                        {status}
                                    </motion.div>
                                )}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-10">
                            <Mail className="w-24 h-24 mb-8" />
                            <h3 className="text-5xl font-black serif">Vælg en besked</h3>
                            <p className="text-xl font-medium mt-4">Vælg en samtale fra oversigten for at se detaljer og svare.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* AI Pulse Sidebar (Overlay) */}
            <AnimatePresence>
                {showAiPulse && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAiPulse(false)}
                            className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-[50]" 
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[60] flex flex-col"
                        >
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/10">
                                        <Sparkles className="w-5 h-5 fill-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 serif">Smart Triage</h2>
                                </div>
                                <button onClick={() => setShowAiPulse(false)} className="p-2 bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-40 opacity-40">
                                        <RefreshCw className="w-12 h-12 animate-spin mb-6 text-indigo-600" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Analyserer sammenhænge...</p>
                                    </div>
                                ) : inboxAnalysis ? (
                                    <>
                                        <section>
                                            <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">Status & Overblik</h3>
                                            <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-50">
                                                <p className="text-xl font-black text-slate-900 italic serif mb-4">"{inboxAnalysis.status}"</p>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{inboxAnalysis.analysis}</p>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] mb-4">Top 3 Prioriteter</h3>
                                            <div className="space-y-4">
                                                {inboxAnalysis.priorities?.map((p: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex flex-shrink-0 items-center justify-center text-[10px] font-black italic">!</div>
                                                        <p className="text-sm font-bold text-slate-900 leading-tight">{p}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-4">Strategisk Råd</h3>
                                            <div className="p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-50 shadow-sm relative group overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                                                    <Zap className="w-12 h-12 fill-emerald-500" />
                                                </div>
                                                <p className="text-sm font-black text-emerald-700 serif leading-relaxed relative z-10">{inboxAnalysis.advice}</p>
                                            </div>
                                        </section>

                                        <section className="pb-10">
                                            <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">Fordeling</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {inboxAnalysis.categories?.map((c: string, i: number) => (
                                                    <span key={i} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">{c}</span>
                                                ))}
                                            </div>
                                        </section>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                        <AlertCircle className="w-12 h-12 mb-4" />
                                        <p className="text-xs font-black uppercase">Ingen data at analysere</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Custom CSS for scrollbar */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #f1f5f9;
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #e2e8f0;
                }
            `}</style>
        </div>
    );
}
