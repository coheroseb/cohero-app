
'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Bell, Send, Users, Loader2, CheckCircle, Info, Smartphone, Zap, Target, History, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { queueNotificationAction } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';

type TargetGroup = 'all' | 'Socialrådgiver' | 'Pædagog' | 'Lærer' | 'Sygeplejerske' | 'premium' | 'free';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profession?: string;
  membership?: string;
  fcmTokens?: string[];
}

export default function AdminNotificationsPage() {
    const { user } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
    const [isSending, setIsSending] = useState(false);
    const [sendStats, setSendStats] = useState<{ count: number, group: string } | null>(null);

    // READ USERS
    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !message.trim() || isSending || !users) return;

        // FILTER LOCALLY
        const targets = users.filter(u => {
            const hasTokens = u.fcmTokens && u.fcmTokens.length > 0;
            if (!hasTokens) return false;

            if (targetGroup === 'all') return true;
            if (targetGroup === 'premium') return ['Kollega+', 'Semesterpakken', 'Group Pro'].includes(u.membership || '');
            if (targetGroup === 'free') return u.membership === 'Kollega' || !u.membership;
            return u.profession === targetGroup;
        });

        if (targets.length === 0) {
            toast({
                variant: "destructive",
                title: "Ingen modtagere",
                description: "Der blev ikke fundet nogen brugere i denne gruppe med push-notifikationer slået til."
            });
            return;
        }

        if (!confirm(`Vil du udsende denne notifikation til ${targets.length} brugere?`)) return;

        setIsSending(true);
        try {
            const result = await queueNotificationAction({
                title: title.trim(),
                body: message.trim(),
                targetGroup: targetGroup,
                recipientUids: targets.map(t => t.id),
                sentBy: user?.uid || 'unknown'
            });

            if (result.success) {
                setSendStats({ count: targets.length, group: targetGroup });
                setTitle(''); setMessage('');
                toast({ title: "Notifikation i kø", description: `Beskeden sendes til ${targets.length} brugere.` });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fejl", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 serif mb-2">Push Command Center</h1>
                   <p className="text-slate-500 font-medium">Udsend øjeblikkelige system-beskeder og engagements-notifikationer.</p>
                </div>
                <div className="flex items-center gap-4 px-5 py-3 bg-indigo-50 border border-indigo-100/60 rounded-2xl">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 leading-none mb-1">Infrastructure</p>
                        <p className="text-xs font-bold text-indigo-900 leading-none">FCM Gateway Ready</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                
                {/* Notification Editor */}
                <div className="xl:col-span-8 space-y-8">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-10 space-y-10">
                            <form onSubmit={handleSendNotification} className="space-y-10">
                                
                                {/* Segmentation */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Segment</label>
                                        <div className="flex items-center gap-2 text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black uppercase">
                                            <Target className="w-3.5 h-3.5" /> Granular Control
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'all', label: 'Alle' },
                                                { id: 'Socialrådgiver', label: 'Socialrådgivere' },
                                                { id: 'Pædagog', label: 'Pædagoger' },
                                                { id: 'Lærer', label: 'Lærere' },
                                                { id: 'premium', label: 'Premium' },
                                                { id: 'free', label: 'Free Tier' }
                                            ].map((group) => (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    onClick={() => setTargetGroup(group.id as TargetGroup)}
                                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${targetGroup === group.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                >
                                                    {group.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Headline</label>
                                        <Input 
                                            value={title} 
                                            onChange={(e) => setTitle(e.target.value)} 
                                            placeholder="F.eks. Ny Lovændring for Socialrådgivere..." 
                                            className="h-14 font-black text-slate-900 serif text-xl border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none" 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Message Body</label>
                                        <Textarea 
                                            value={message} 
                                            onChange={(e) => setMessage(e.target.value)} 
                                            placeholder="Beskriv hvad notifikationen handler om..." 
                                            className="min-h-[140px] px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none" 
                                            required 
                                        />
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="pt-4 border-t border-slate-50">
                                    <Button 
                                        type="submit" 
                                        disabled={isSending || usersLoading || !title || !message} 
                                        className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-lg serif uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-5 group"
                                    >
                                        {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Broadcast Now <Zap className="w-5 h-5 fill-white group-hover:animate-bounce" /></>}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>

                {/* Sidebar & Preview */}
                <div className="xl:col-span-4 space-y-10">
                    
                    {/* Live Mobile Preview */}
                    <section className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-black text-white serif">Mobile Insight</h3>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-900 border border-white/20 rounded-xl flex items-center justify-center">
                                       <img src="/main_logo.png" className="w-6 h-auto opacity-80" alt="C" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Cohéro App</p>
                                        <p className="text-white font-black text-sm truncate uppercase tracking-tight">{title || 'Notifikation Titel'}</p>
                                    </div>
                                    <p className="text-[8px] font-bold text-white/20">LIGE NU</p>
                                </div>
                                <p className="text-xs text-white/50 font-bold leading-relaxed line-clamp-3">
                                    {message || 'Her vises forhåndsvisningen af din besked, som den vil fremstå på brugerens låseskærm.'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pt-4">
                                <span>IOS / ANDROID SYNC</span>
                                <Sparkles className="w-4 h-4 opacity-40 group-hover:rotate-12 transition-transform" />
                            </div>
                        </div>
                    </section>

                    {/* Stats */}
                    <div className="grid gap-6">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Active Listeners</p>
                                <p className="text-3xl font-black text-slate-900 serif leading-none">{usersLoading ? '...' : users?.filter(u => u.fcmTokens && u.fcmTokens.length > 0).length || 0}</p>
                            </div>
                        </section>

                        <section className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                            <div className="flex items-center gap-3 text-emerald-700 mb-4 font-black uppercase text-[10px] tracking-widest">
                                <History className="w-4 h-4" /> Latest Session
                            </div>
                            {sendStats ? (
                                <div className="space-y-2">
                                    <p className="text-lg font-black text-emerald-950 serif leading-tight">Delivered to {sendStats.count} units</p>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-emerald-100 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-widest w-fit">
                                        <CheckCircle className="w-3 h-3" /> Transmitted
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 gap-2 text-emerald-300">
                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Ready for deployment</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Info className="w-4 h-4" /> Policy Engine
                        </h3>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                            Systemet respekterer automatisk brugernes notifikations-indstillinger. Push-notifikationer sendes via hhv. APNs og FCM.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

