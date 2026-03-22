'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Check, Trash2, Calendar, Sparkles, AlertCircle, Info, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { requestNotificationPermission } from '@/firebase/messaging';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'plan' | 'schedule';
  read: boolean;
  createdAt: any;
  link?: string;
}

const NotificationBell = () => {
    const { user } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !firestore) return;

        const q = query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(fetched);
            setUnreadCount(fetched.filter(n => !n.read).length);
        });

        return () => unsub();
    }, [user, firestore]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = async () => {
        if (!user || !firestore) return;
        const unread = notifications.filter(n => !n.read);
        for (const n of unread) {
            await updateDoc(doc(firestore, 'users', user.uid, 'notifications', n.id), { read: true });
        }
    };

    const deleteNotification = async (id: string) => {
        if (!user || !firestore) return;
        await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', id));
    };

    const handleEnablePush = async () => {
        if (!user) return;
        try {
            await requestNotificationPermission(user.uid);
            toast({
                title: "Push-notifikationer aktiveret!",
                description: "Du modtager nu opdateringer direkte på din enhed.",
            });
        } catch (e: any) {
            toast({
                title: "Kunne ikke aktivere push",
                description: e.message,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAllAsRead();
                }}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl z-[150] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifikationer</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider">Meld læst</button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                                        <BellOff className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">Ingen nye beskeder lige nu.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((n) => (
                                        <div key={n.id} className={`p-5 hover:bg-slate-50 transition-all group relative ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                    n.type === 'plan' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    n.type === 'schedule' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    n.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    {n.type === 'plan' ? <Calendar className="w-5 h-5" /> :
                                                     n.type === 'schedule' ? <Zap className="w-5 h-5" /> :
                                                     n.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                                                     <Info className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0 flex-grow pr-6">
                                                    <p className="text-xs font-black text-slate-900 mb-1">{n.title}</p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{n.body}</p>
                                                    <p className="text-[9px] text-slate-300 font-bold uppercase mt-2">
                                                        {n.createdAt?.toDate?.() ? n.createdAt.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : 'Lige nu'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => deleteNotification(n.id)}
                                                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer - Enable Push */}
                        <div className="p-6 border-t border-slate-100 bg-indigo-900 text-white">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Push-Beskeder</p>
                                    <p className="text-xs font-bold leading-tight mt-0.5">Få besked når din AI-arkitekt er færdig.</p>
                                </div>
                             </div>
                             <Button 
                                onClick={handleEnablePush}
                                className="w-full mt-4 bg-white text-indigo-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[9px] h-10 rounded-xl"
                             >
                                Aktivér Notifikationer
                             </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
