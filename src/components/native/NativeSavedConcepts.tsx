'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  ChevronRight, 
  BookOpen,
  History,
  Sparkles,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

const NativeSavedConcepts: React.FC = () => {
  const { user } = useApp();
  const firestore = useFirestore();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(
      collection(firestore, 'users', user.uid, 'savedConcepts'),
      orderBy('savedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setSaved(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user, firestore]);

  const handleDelete = async (id: string, name: string) => {
    if (!user || !firestore) return;
    triggerHapticFeedback(ImpactStyle.Medium);
    await deleteDoc(doc(firestore, 'users', user.uid, 'savedConcepts', id));
  };

  const filtered = saved.filter(s => 
    s.conceptName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Search Header */}
      <div className="px-5 pt-1 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Søg i dine gemte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-20 text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 shadow-sm border border-slate-100">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black text-slate-900">Ingen gemte endnu</p>
            <p className="text-sm font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">Gem dine favoritbegreber for hurtig adgang senere.</p>
          </div>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative">
               <Link 
                href={`/concept-explainer?term=${encodeURIComponent(item.conceptName)}`}
                onClick={() => triggerHapticFeedback(ImpactStyle.Light)}
                className="block p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm active:bg-slate-50 transition-all pr-14"
               >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{item.conceptName}</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium line-clamp-1">
                  Gemt {new Date(item.savedAt?.toDate()).toLocaleDateString('da-DK', { month: 'long', day: 'numeric' })}
                </p>
              </Link>
              <button 
                onClick={() => handleDelete(item.id, item.conceptName)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-slate-200 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Card */}
      {saved.length > 0 && (
        <div className="px-5 mt-10">
          <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-xl">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest w-fit">
              <Sparkles className="w-3 h-3" /> Dit Bibliotek
            </div>
            <p className="text-2xl font-black tracking-tight leading-tight">Du har her {saved.length} begreber gemt til fremtidig brug.</p>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">Dit personlige arkiv vokser støt. Godt gået!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NativeSavedConcepts;
