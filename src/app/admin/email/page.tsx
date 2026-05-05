
'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/app/provider';
import { sendAdminEmailAction } from '@/app/actions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, 
    Send, 
    Users, 
    UserPlus, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ArrowLeft,
    Sparkles,
    Layout,
    Type,
    Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminEmailBroadcastPage() {
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetGroup, setTargetGroup] = useState<'all' | 'Kollega' | 'Kollega+'>('all');
    const [isSending, setIsSending] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Fetch user counts for preview
    const kollegaQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('membership', '==', 'Kollega')) : null),
        [firestore]
    );
    const kollegaPlusQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('membership', '==', 'Kollega+')) : null),
        [firestore]
    );
    const allUsersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users')) : null),
        [firestore]
    );

    const { data: kollegas } = useCollection<any>(kollegaQuery);
    const { data: kollegaPlus } = useCollection<any>(kollegaPlusQuery);
    const { data: allUsers } = useCollection<any>(allUsersQuery);

    const counts = useMemo(() => ({
        all: allUsers?.length || 0,
        Kollega: kollegas?.length || 0,
        'Kollega+': kollegaPlus?.length || 0
    }), [allUsers, kollegas, kollegaPlus]);

    if (!user || userProfile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
                <p className="text-slate-400 font-black uppercase tracking-widest">Ingen adgang</p>
            </div>
        );
    }

    const handleSend = async () => {
        if (!subject || !body) {
            toast({ variant: 'destructive', title: "Fejl", description: "Udfyld venligst emne og besked." });
            return;
        }

        if (!confirm(`Er du sikker på, at du vil sende denne mail til ${counts[targetGroup]} modtagere?`)) return;

        setIsSending(true);
        try {
            const res = await sendAdminEmailAction({
                subject,
                body,
                targetGroup,
                adminUid: user.uid
            });

            if (res.success) {
                toast({ title: "Succes!", description: `Mailen er sendt til ${res.sentCount} brugere.` });
                setSubject('');
                setBody('');
            } else {
                toast({ variant: 'destructive', title: "Fejl", description: res.error });
            }
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Kritisk Fejl", description: err.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-40">
            <header className="pt-12 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-600 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3 h-3" /> Tilbage til Admin
                    </button>
                    <div className="flex items-center gap-4 text-indigo-600">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Email Broadcast</h3>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">Broadcast Center</h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">Send proaktive beskeder, nyheder eller vigtige opdateringer til dine brugere via Resend.</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Modtagere</p>
                        <p className="text-3xl font-black text-slate-900 serif">{counts.all}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="text-center">
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Kollega+</p>
                        <p className="text-3xl font-black text-indigo-600 serif">{counts['Kollega+']}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Editor Column */}
                <div className="lg:col-span-7 space-y-8">
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Sparkles className="w-32 h-32 text-indigo-600" />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Layout className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Vælg Modtagergruppe</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'all', label: 'Alle', icon: Users },
                                    { id: 'Kollega', label: 'Kollega', icon: UserPlus },
                                    { id: 'Kollega+', label: 'Kollega+', icon: Sparkles }
                                ].map((group) => (
                                    <button
                                        key={group.id}
                                        onClick={() => setTargetGroup(group.id as any)}
                                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                            targetGroup === group.id 
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                            : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        <group.icon className={`w-6 h-6 ${targetGroup === group.id ? 'fill-indigo-600/10' : ''}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{group.label}</span>
                                        <span className="text-xs font-bold opacity-60">({counts[group.id as keyof typeof counts]})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <Type className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Email Indhold</h3>
                            </div>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Email Emne..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-6 bg-slate-50 border-transparent border-2 focus:border-indigo-500 focus:bg-white rounded-[1.5rem] outline-none transition-all font-bold text-lg text-slate-900"
                                />
                                <textarea 
                                    placeholder="Skriv din besked her... (HTML understøttet)"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="w-full h-80 p-8 bg-slate-50 border-transparent border-2 focus:border-indigo-500 focus:bg-white rounded-[2rem] outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-between">
                            <button 
                                onClick={() => setPreviewMode(!previewMode)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> {previewMode ? 'Skjul Preview' : 'Vis Preview'}
                            </button>
                            <Button 
                                onClick={handleSend}
                                disabled={isSending || !subject || !body}
                                className="h-16 px-10 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {isSending ? 'Sender...' : 'Send Broadcast Now'}
                            </Button>
                        </div>
                    </section>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-5">
                    <AnimatePresence mode="wait">
                        {previewMode ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="sticky top-12 space-y-6"
                            >
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4">Live Preview</h3>
                                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Fra:</span>
                                            <span className="text-[10px] font-bold text-slate-900">Cohéro &lt;info@platform.cohero.dk&gt;</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Emne:</span>
                                            <span className="text-[10px] font-bold text-indigo-600">{subject || '(Intet emne)'}</span>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-[#FDFCF8] min-h-[400px]">
                                        <div className="max-w-[400px] mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                            <h2 className="text-2xl font-black text-indigo-600 serif mb-6">Hej {userProfile?.username || 'Kollega'}</h2>
                                            <div 
                                                className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') || '<p class="text-slate-300 italic">Din besked vil blive vist her...</p>' }}
                                            />
                                            <hr className="my-8 border-slate-100" />
                                            <p className="text-[10px] text-slate-300 text-center uppercase tracking-widest font-black opacity-50">
                                                © {new Date().getFullYear()} Cohéro I/S • Træn din faglighed. Trygt.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="sticky top-12 p-12 border-4 border-dashed border-slate-100 rounded-[4rem] text-center flex flex-col items-center justify-center gap-6 opacity-40">
                                <Mail className="w-16 h-16 text-slate-200" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 leading-relaxed">
                                    Aktivér preview for at se,<br/>hvordan din mail ser ud<br/>for modtagerne.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
