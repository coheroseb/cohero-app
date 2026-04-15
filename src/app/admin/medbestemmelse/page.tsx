
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Loader2, Search, Trash2, CheckCircle2, 
  Lightbulb, CalendarDays, ArrowRight, Filter,
  TrendingUp, Star, Clock, Trash, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { updateFeatureRequestStatusAction, deleteFeatureRequestAction, generateAIFeatureRequestsAction } from '@/app/actions';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'suggested' | 'planned' | 'in-progress' | 'completed';
  authorName: string;
  createdAt: { toDate: () => Date };
}

const STATUS_CONFIG = {
  suggested: { label: 'Forslag', color: 'bg-slate-100 text-slate-600', icon: Lightbulb },
  planned: { label: 'Planlagt', color: 'bg-indigo-100 text-indigo-700', icon: CalendarDays },
  'in-progress': { label: 'I gang', color: 'bg-amber-100 text-amber-700', icon: Clock },
  completed: { label: 'Fuldført', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const AdminMedbestemmelsePage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const requestsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'featureRequests'), orderBy('votes', 'desc')) : null), [firestore]);
  const { data: requests, isLoading, error } = useCollection<FeatureRequest>(requestsQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    if (!requests) return { total: 0, completed: 0, votes: 0 };
    return {
      total: requests.length,
      completed: requests.filter(r => r.status === 'completed').length,
      votes: requests.reduce((acc, curr) => acc + (curr.votes || 0), 0)
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.authorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const statuses: ('suggested' | 'planned' | 'in-progress' | 'completed')[] = ['suggested', 'planned', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus as any);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    setIsUpdating(id);
    try {
      const res = await updateFeatureRequestStatusAction(id, nextStatus);
      if (res.success) {
        toast({ title: "Status Opdateret", description: `Feature er nu mærket som ${nextStatus}` });
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere status" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Er du sikker på at du vil slette forslaget: "${title}"?`)) return;

    try {
      const res = await deleteFeatureRequestAction(id);
      if (res.success) {
        toast({ title: "Forslag Slettet", description: "Forslaget er fjernet permanent." });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke slette forslaget" });
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await generateAIFeatureRequestsAction();
      if (res.success) {
        toast({ title: "AI Forslag Genereret", description: "6 nye forslag er blevet tilføjet til databasen." });
      } else {
        throw new Error("Failed to generate");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Fejl", description: err.message || "Kunne ikke generere forslag" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-ink pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 serif">Medbestemmelse</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Administrér brugerforslag og prioritér Roadmap.</p>
        </div>
        <div className="relative z-10">
          <Button 
            variant="outline"
            disabled={isGenerating}
            onClick={handleGenerateAI}
            className="rounded-2xl border-indigo-100 bg-indigo-50/30 text-indigo-600 font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-sm hover:bg-indigo-50 transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generér AI Forslag
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
           <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Totale Forslag</p>
              <div className="text-4xl font-black text-slate-900">{stats.total}</div>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
           <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Fuldført</p>
              <div className="text-4xl font-black text-slate-900">{stats.completed}</div>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
           <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Totale Stemmer</p>
              <div className="text-4xl font-black text-slate-900">{stats.votes}</div>
           </div>
        </div>
      </div>

      {/* Requests Explorer */}
      <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 bg-slate-50/10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group w-full max-w-xl">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
             <input 
               type="text" 
               placeholder="Søg i titler, beskrivelser eller forfattere..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm w-full font-medium shadow-sm"
             />
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                 <Filter className="w-3.5 h-3.5 text-slate-400" />
                 <select 
                   value={statusFilter} 
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-4 cursor-pointer"
                 >
                   <option value="all">Alle Statusser</option>
                   <option value="suggested">Forslag</option>
                   <option value="planned">Planlagt</option>
                   <option value="in-progress">I gang</option>
                   <option value="completed">Fuldført</option>
                 </select>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-indigo-100" />
             <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Henter Roadmap...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 text-center">
             <p className="text-slate-400 font-medium italic">Ingen forslag fundet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredRequests.map((req, idx) => {
              const StatusIcon = STATUS_CONFIG[req.status].icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={req.id} 
                  className="p-8 hover:bg-slate-50/50 transition-all group flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${STATUS_CONFIG[req.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG[req.status].label}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400">Af {req.authorName}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 serif group-hover:text-indigo-600 transition-colors">{req.title}</h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">{req.description}</p>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-center group/votes">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover/votes:text-amber-500 transition-colors">Stemmer</p>
                       <p className="text-2xl font-black text-slate-900 group-hover/votes:scale-110 transition-transform">{req.votes || 0}</p>
                    </div>

                    <div className="flex items-center gap-3">
                       <Button 
                         variant="outline"
                         size="sm"
                         disabled={isUpdating === req.id}
                         onClick={() => handleUpdateStatus(req.id, req.status)}
                         className="rounded-xl h-10 px-5 border-slate-100 text-slate-600 font-bold text-xs hover:bg-white active:scale-95 transition-all shadow-sm"
                       >
                         {isUpdating === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : (
                           <>
                             Skift Status <ArrowRight className="w-3.5 h-3.5 ml-2 text-indigo-500" />
                           </>
                         )}
                       </Button>
                       <Button 
                         variant="outline"
                         size="sm"
                         onClick={() => handleDelete(req.id, req.title)}
                         className="rounded-xl w-10 h-10 p-0 border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                       >
                         <Trash className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminMedbestemmelsePage;
