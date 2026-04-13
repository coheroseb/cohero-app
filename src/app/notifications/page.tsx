'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, Calendar, Sparkles, AlertCircle, Info, Zap, Check } from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  limit 
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'plan' | 'schedule';
  read: boolean;
  createdAt: any;
  link?: string;
}

export default function NotificationsPage() {
  const { user } = useApp();
  const firestore = useFirestore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fetched);
      setLoading(false);
    }, (err) => {
      console.error('[NotificationsPage] Error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, firestore]);

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifikationer</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Status & Opdateringer</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-[10px] font-black uppercase text-indigo-600 tracking-widest gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            Meld alt læst
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-100 shadow-sm">
              <BellOff className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-slate-900">Ingen notifikationer</p>
              <p className="text-sm text-slate-400 font-medium">Vi giver dig besked når der sker noget nyt.</p>
            </div>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-5 bg-white rounded-[2rem] border transition-all relative overflow-hidden group ${
                !n.read ? 'border-indigo-100 shadow-md shadow-indigo-500/5' : 'border-slate-100 opacity-80'
              }`}
            >
              {!n.read && <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />}
              
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
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
                
                <div className="flex-1 pr-8">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-slate-900">{n.title}</p>
                    <p className="text-[10px] text-slate-300 font-bold uppercase">
                      {n.createdAt?.toDate?.() ? n.createdAt.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : 'Lige nu'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium mb-3">{n.body}</p>
                  
                  {n.link && (
                    <Link 
                      href={n.link}
                      className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-1 hover:underline"
                    >
                      Se mere <Sparkles className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              <button 
                onClick={() => deleteNotification(n.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-12 p-8 bg-indigo-950 rounded-[3rem] text-center space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-white font-black text-xl">Husk push-beskeder</h2>
            <p className="text-indigo-200/60 text-sm font-medium">Hold dig opdateret på AI-analyser og sagsbehandling, selv når appen er lukket.</p>
          </div>
          <Button variant="secondary" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-white text-indigo-950 hover:bg-slate-100">
            Gå til indstillinger
          </Button>
        </div>
      </div>
    </div>
  );
}
