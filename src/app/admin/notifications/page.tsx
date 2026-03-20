'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Bell, Send, Users, Loader2, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { queueNotificationAction } from '@/app/actions';

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
    const { user, userProfile } = useApp();
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

    if (userProfile?.role !== 'admin' && userProfile?.membership !== 'Admin') {
        return <div className="p-20 text-center font-bold text-rose-600">Adgang nægtet. Kun for administratorer.</div>;
    }

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !message.trim() || isSending || !users) return;

        // FILTER LOCALLY
        const targets = users.filter(u => {
            const hasTokens = u.fcmTokens && u.fcmTokens.length > 0;
            if (!hasTokens) return false;

            if (targetGroup === 'all') return true;
            if (targetGroup === 'premium') return ['Kollega+', 'Kollega++', 'Semesterpakken', 'Group Pro'].includes(u.membership || '');
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

        if (!confirm(`Er du sikker på at du vil sende denne notifikation til ${targets.length} brugere?`)) return;

        setIsSending(true);
        try {
            // SERVER ACTION - NO FIRESTORE CALLS HERE
            const result = await queueNotificationAction({
                title: title.trim(),
                body: message.trim(),
                targetGroup: targetGroup,
                recipientUids: targets.map(t => t.id),
                sentBy: user?.uid || 'unknown'
            });

            if (result.success) {
                setSendStats({ count: targets.length, group: targetGroup });
                setTitle('');
                setMessage('');
                toast({ title: "Notifikation i kø", description: `Beskeden sendes til ${targets.length} brugere.` });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error("NOTIFICATION ERROR:", error);
            toast({ variant: "destructive", title: "Fejl", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-12">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-amber-950 serif">Push Notifikationer</h1>
                </div>
                <p className="text-slate-500 font-medium italic">Send direkte beskeder til brugernes telefoner og computere.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSendNotification} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl space-y-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Målgruppe</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'all', label: 'Alle' },
                                    { id: 'Socialrådgiver', label: 'Socialrådgivere' },
                                    { id: 'Pædagog', label: 'Pædagoger' },
                                    { id: 'premium', label: 'Premium' },
                                    { id: 'free', label: 'Gratis brugere' }
                                ].map((group) => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setTargetGroup(group.id as TargetGroup)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${targetGroup === group.id ? 'bg-amber-950 text-white border-amber-950 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-200'}`}
                                    >
                                        {group.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Overskrift</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Ny Lovanalyse klar" className="h-12 rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Besked</label>
                                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hvad vil du fortælle dine brugere?" className="min-h-[120px] rounded-2xl" required />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isSending || usersLoading || !title || !message} className="w-full h-14 rounded-2xl bg-amber-950 text-white shadow-2xl active:scale-95 transition-all group">
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Udsend notifikation nu <Send className="w-4 h-4 ml-2" /></>}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 space-y-4">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2"><Info className="w-4 h-4" /> Værd at vide</h3>
                        <ul className="text-xs text-amber-800/70 space-y-3 font-medium leading-relaxed">
                            <li>• Notifikationer sendes kun til brugere, der har takket ja under "Indstillinger".</li>
                            <li>• PWA-notifikationer virker bedst når appen er installeret.</li>
                        </ul>
                    </div>

                    {sendStats && (
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 animate-ink">
                            <div className="flex items-center gap-3 text-emerald-700 font-bold mb-2"><CheckCircle className="w-5 h-5" /> Sendt!</div>
                            <p className="text-xs text-emerald-600 leading-relaxed font-medium">Beskeden blev sat i kø til <strong>{sendStats.count}</strong> brugere.</p>
                        </div>
                    )}
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4"><Users className="w-4 h-4" /> Aktive enheder</div>
                        <p className="text-2xl font-bold text-slate-700 serif italic">{usersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : users?.filter(u => u.fcmTokens && u.fcmTokens.length > 0).length || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
