
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup, orderBy, doc, getDoc } from 'firebase/firestore';
import { 
  Loader2, 
  Search, 
  Presentation as MonitorPlay, 
  Calendar, 
  User, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  Filter, 
  ArrowUpDown,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  BrainCircuit,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SavedSeminar {
  id: string;
  overallTitle: string;
  fileName?: string;
  category?: string;
  createdAt: any;
  slides: any[];
  userId: string;
  userName?: string;
}

export default function AdminSeminarsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch all seminars across all users
  const seminarsQuery = useMemoFirebase(() => (
    firestore ? query(collectionGroup(firestore, 'seminars'), orderBy('createdAt', 'desc')) : null
  ), [firestore]);

  const { data: rawSeminars, isLoading: isSeminarsLoading, error: seminarsError } = useCollection<any>(seminarsQuery);

  // Fetch all users to map userId to userName
  const usersQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'users')) : null
  ), [firestore]);
  const { data: users } = useCollection<any>(usersQuery);

  const usersMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.id, u]));
  }, [users]);

  const seminars = useMemo(() => {
    if (!rawSeminars) return [];
    return rawSeminars.map(s => {
      // Debug: Log et enkelt objekt for at se strukturen
      if (rawSeminars.indexOf(s) === 0) console.log('[AdminSeminars] Sample doc:', s);

      // Prøv forskellige måder at finde path på
      const path = s.ref?.path || s._path || s.__path || (s.id ? `users/?/seminars/${s.id}` : '');
      const pathSegments = path.split('/');
      
      // I en collectionGroup sti (users/UID/seminars/ID) er UID normalt på index 1
      const userId = pathSegments[1] || '';
      const user = usersMap.get(userId);
      
      return {
        ...s,
        userId,
        userName: user?.username || user?.displayName || user?.email || (path ? `Ukendt (ID: ${userId})` : 'Ingen reference'),
        userEmail: user?.email || 'Ingen email',
        debugPath: path
      };
    }) as SavedSeminar[];
  }, [rawSeminars, usersMap]);

  const categories = useMemo(() => {
    const cats = new Set(seminars.map(s => s.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [seminars]);

  const filteredSeminars = useMemo(() => {
    let result = [...seminars];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.overallTitle?.toLowerCase().includes(q) || 
        s.userName?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(s => s.category === categoryFilter);
    }

    result.sort((a, b) => {
      const dateA = a.createdAt?.toDate()?.getTime() || 0;
      const dateB = b.createdAt?.toDate()?.getTime() || 0;
      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'slides_desc') return (b.slides?.length || 0) - (a.slides?.length || 0);
      return 0;
    });

    return result;
  }, [seminars, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="space-y-10 animate-ink pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 serif">Seminar-arkiv</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Overblik over alle bruger-genererede seminarer og AI-analyser.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
            <div className="px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Total Seminarer</p>
                <p className="text-xl font-black text-indigo-900 serif">{seminars.length}</p>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="relative group w-full xl:max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Søg i titler, brugere eller kategorier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-sm w-full font-medium shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-4 cursor-pointer"
            >
              <option value="all">Alle Kategorier</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-black text-indigo-900 outline-none pr-4 cursor-pointer uppercase tracking-tighter"
            >
              <option value="newest">Nyeste</option>
              <option value="oldest">Ældste</option>
              <option value="slides_desc">Flest Slides</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-6">
        {seminarsError && (
          <div className="p-10 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-6 text-rose-600">
             <ShieldAlert className="w-10 h-10 shrink-0" />
             <div className="space-y-1">
                <p className="font-black serif text-lg">Hov, der skete en database-fejl</p>
                <p className="text-sm font-medium opacity-80">{seminarsError.message}</p>
                {seminarsError.message.includes('index') && (
                  <p className="text-xs font-bold mt-4 p-4 bg-white/50 rounded-2xl border border-rose-200">
                    Det ligner at du mangler et Firestore Index. Tjek din browser-konsol (F12) for et link til at oprette det automatisk.
                  </p>
                )}
             </div>
          </div>
        )}

        {isSeminarsLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Henter arkiv...</p>
          </div>
        ) : filteredSeminars.length === 0 ? (
          <div className="p-20 text-center bg-white border border-slate-100 rounded-[3rem]">
            <p className="text-slate-400 font-bold italic">Ingen seminarer fundet.</p>
          </div>
        ) : (
          filteredSeminars.map((seminar, idx) => (
            <motion.div 
              key={seminar.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                  <MonitorPlay className="w-8 h-8" />
                </div>

                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900 serif truncate">{seminar.overallTitle || 'Uden titel'}</h3>
                      {seminar.category && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                          {seminar.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-900">{seminar.userName}</span>
                        <span className="text-slate-300 font-medium">({seminar.userEmail})</span>
                      </div>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {seminar.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-900">{seminar.slides?.length || 0} Slides</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <BrainCircuit className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-900">
                        {seminar.slides?.reduce((acc, s) => acc + (s.keyConcepts?.length || 0), 0)} Begreber
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link 
                    href={`/shared/seminar/${seminar.id}?ownerId=${seminar.userId}`}
                    target="_blank"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Se Seminar <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link 
                    href={`/admin/users?search=${encodeURIComponent(seminar.userEmail || '')}`}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-colors shadow-lg"
                    title="Gå til bruger"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
