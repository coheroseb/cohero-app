'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Mail, 
  Clock, 
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Box,
  ChevronRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProofreadingRequestStatusAction } from '@/app/actions';

export default function AdminKorrekturPage() {
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const requestsQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'proofreadingRequests'), orderBy('createdAt', 'desc')) : null
  ), [firestore]);

  const { data: requests, isLoading } = useCollection<any>(requestsQuery);

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase()) || req.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (id: string, newStatus: any) => {
    await updateProofreadingRequestStatusAction(id, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'contacted': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Afventer',
    contacted: 'Kontaktet',
    completed: 'Færdig',
    rejected: 'Afvist'
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-950 text-amber-400 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-950/20">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Korrektur-administration</h1>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">
              Overblik over alle indkomne tilbudsanmodninger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                <p className="text-xl font-black text-slate-900 serif">{requests?.length || 0}</p>
            </div>
            <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Pending</p>
                <p className="text-xl font-black text-amber-600 serif">{requests?.filter(r => r.status === 'pending').length || 0}</p>
            </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Søg efter navn eller email..." 
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] w-full md:w-auto">
          {['all', 'pending', 'contacted', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f === 'all' ? 'Alle' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
        ) : filteredRequests?.length === 0 ? (
          <div className="p-20 text-center bg-white border border-slate-50 rounded-[3rem]">
            <p className="text-slate-400 font-bold italic">Ingen anmodninger fundet.</p>
          </div>
        ) : (
          filteredRequests?.map((req, idx) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-amber-900/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
                      {req.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 serif leading-none">{req.name}</h3>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {req.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</span>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-300" /> {req.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Omfang / Pris</span>
                      <span className="text-xs font-bold text-slate-900">{req.charCount.toLocaleString('da-DK')} tegn / {req.estimatedPrice} kr.</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit">d. {req.deadline}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                      <select 
                        value={req.status}
                        onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border outline-none ${getStatusColor(req.status)}`}
                      >
                        <option value="pending">Afventer</option>
                        <option value="contacted">Kontaktet</option>
                        <option value="completed">Færdig</option>
                        <option value="rejected">Afvist</option>
                      </select>
                    </div>
                  </div>

                  {req.message && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-3">
                      <MessageSquare className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 italic leading-relaxed">"{req.message}"</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-3">
                   <a 
                    href={`mailto:${req.email}?subject=Vedr. din forespørgsel på korrektur`}
                    className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-colors shadow-lg"
                   >
                     <Mail className="w-5 h-5" />
                   </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
