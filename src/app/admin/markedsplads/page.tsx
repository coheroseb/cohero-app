
'use client';

import React, { useState, useMemo } from 'react';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Trash2, 
  TrendingUp,
  HandHelping,
  CreditCard,
  User,
  ChevronDown,
  ArrowUpDown,
  Star,
  Banknote,
  Plus,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserMinus,
  Zap,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { AssistanceRequest } from '@/ai/flows/types';
import { sendTaskResetEmailAction } from '@/app/actions';
import { createAssistanceRequestAction } from '@/app/markedsplads/actions';
import { motion, AnimatePresence } from 'framer-motion';

const STAT_CARDS = [
  { label: 'Totale Opgaver', key: 'total', icon: HandHelping, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100/50' },
  { label: 'Aktive Forløb', key: 'claimed', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100/50' },
  { label: 'Transaktioner', key: 'paid', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100/50' },
  { label: 'Afventende', key: 'open', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-100/50' },
];

const AdminMarkedspladsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'claimed' | 'paid' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_desc' | 'price_asc'>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Rådgivning' as AssistanceRequest['category'],
    price: 500,
    location: '',
    citizenName: '',
    citizenEmail: '',
    citizenPhone: '',
    dueDate: ''
  });

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assistance_requests'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection<AssistanceRequest>(requestsQuery);

  const stats = useMemo(() => {
    if (!requests) return { total: 0, open: 0, claimed: 0, paid: 0, completed: 0 };
    return {
      total: requests.length,
      open: requests.filter(r => r.status === 'open').length,
      claimed: requests.filter(r => r.status === 'claimed' && !r.isPaid).length,
      paid: requests.filter(r => r.isPaid && r.status !== 'completed').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    let result = requests.filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (req.title?.toLowerCase() || '').includes(searchLower) || 
                           (req.citizenName?.toLowerCase() || '').includes(searchLower) ||
                           (req.studentName?.toLowerCase() || '').includes(searchLower);
      
      let matchesStatus = statusFilter === 'all';
      if (!matchesStatus) {
        if (statusFilter === 'paid') matchesStatus = req.isPaid && req.status !== 'completed';
        else if (statusFilter === 'completed') matchesStatus = req.status === 'completed';
        else matchesStatus = req.status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'price_desc') result.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === 'price_asc') result.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    return result;
  }, [requests, searchTerm, statusFilter, sortBy]);

  const handleResetRequest = async (req: AssistanceRequest) => {
    if (!firestore || !window.confirm('Vil du nulstille denne opgave?')) return;
    try {
      await updateDoc(doc(firestore, 'assistance_requests', req.id), {
        status: 'open',
        studentId: null,
        studentName: null,
        studentEmail: null,
        studentPhone: null,
        claimedAt: null
      });
      if (req.citizenEmail) await sendTaskResetEmailAction(req.citizenEmail, req.title);
      toast({ title: 'Opgave nulstillet' });
    } catch (err) {
      toast({ title: 'Fejl ved nulstilling', variant: 'destructive' });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!firestore || !window.confirm('Slet opgaven permanent?')) return;
    try {
      await deleteDoc(doc(firestore, 'assistance_requests', id));
      toast({ title: 'Opgave slettet' });
    } catch (err) {
      toast({ title: 'Fejl ved sletning', variant: 'destructive' });
    }
  };

  const handleTogglePayment = async (req: AssistanceRequest) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'assistance_requests', req.id), { isPaid: !req.isPaid });
      toast({ title: `Status opdateret` });
    } catch (err) {
      toast({ title: 'Fejl ved opdatering', variant: 'destructive' });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await createAssistanceRequestAction(formData as any);
      if (result.success) {
        toast({ title: 'Opgave oprettet' });
        setShowCreateModal(false);
        setFormData({ title: '', description: '', category: 'Rådgivning', price: 500, location: '', citizenName: '', citizenEmail: '', citizenPhone: '', dueDate: '' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-ink pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
           <h1 className="text-3xl font-black text-slate-900 serif mb-2">Marketplace Engine</h1>
           <p className="text-slate-500 font-medium">Monitoring af assistance-opgaver, transaktioner og mægler-aktivitet.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
        >
          <Plus className="w-5 h-5" /> Opret Manuel Sag
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {STAT_CARDS.map((stat, i) => (
          <motion.div 
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-8 rounded-[2.5rem] border ${stat.bg} shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 min-h-[140px] flex flex-col justify-between`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900 serif">{isLoading ? '...' : stats[stat.key as keyof typeof stats]}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-10 border-b border-slate-50 bg-slate-50/20 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="relative group w-full lg:max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find opgaver, borgere eller studerende..."
                className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold text-slate-900 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="flex bg-slate-100/50 p-1.5 rounded-[1.5rem] border border-slate-100">
                  {['all', 'open', 'claimed', 'paid', 'completed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f as any)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {f === 'all' ? 'Alle' : f === 'open' ? 'Åbne' : f === 'claimed' ? 'I Gang' : f === 'paid' ? 'Betalt' : 'Slut'}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing transactions...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center gap-8">
             <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <HandHelping className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 serif">Ingen sager fundet</h3>
                <p className="text-slate-400 font-medium">Prøv at justere dine filtre eller søgetermer.</p>
             </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6">Opgave & Kategori</th>
                  <th className="px-10 py-6">Klient / Borger</th>
                  <th className="px-10 py-6">Konsulent / Studerende</th>
                  <th className="px-10 py-6">Financials</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((req, idx) => (
                  <motion.tr 
                    key={req.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <td className="px-10 py-8">
                      <div className="max-w-xs space-y-2">
                        <p className="font-black text-slate-900 serif text-lg leading-tight truncate">{req.title}</p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                           <Tag className="w-3 h-3" /> {req.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-[11px] border border-orange-100 uppercase">
                          {req.citizenName?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{req.citizenName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{req.citizenEmail || 'Ingen mail'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      {req.studentId ? (
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px] border border-indigo-100 uppercase">
                            {req.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-black text-indigo-900 text-sm uppercase tracking-tight">{req.studentName}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-0.5">CONTRACTED</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-widest italic">
                           <Clock className="w-4 h-4 opacity-30" /> Unclaimed
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg font-black text-slate-900 serif leading-none">{req.price} kr.</p>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                           <Banknote className="w-3 h-3" /> Earning: {req.studentEarnings} kr.
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className="flex flex-col gap-3">
                            {req.status === 'completed' ? (
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Delivered</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 px-0.5 opacity-80">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`w-3 h-3 ${star <= (req.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} />
                                        ))}
                                    </div>
                                </div>
                            ) : req.isPaid ? (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm shadow-indigo-500/5">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Paid Out</span>
                                </div>
                            ) : req.status === 'claimed' ? (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm shadow-amber-500/5 animate-pulse">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">In Progress</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Looking...</span>
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {req.studentId && (
                           <button 
                            onClick={() => handleResetRequest(req)}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 rounded-2xl transition-all shadow-sm"
                            title="Nulstil opgave"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleTogglePayment(req)}
                          className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all shadow-sm ${req.isPaid ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100'}`}
                          title="Marker betaling"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="w-12 h-12 flex items-center justify-center bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl lg:hover:bg-rose-500 lg:hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <div>
                  <h2 className="text-2xl font-black text-slate-900 serif flex items-center gap-3">Manual Case Entry</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Udfyld system-informationer for oprettelse</p>
                </div>
                <button onClick={() => !isSubmitting && setShowCreateModal(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl hover:bg-slate-100 transition-colors text-slate-400"><X className="w-6 h-6"/></button>
              </div>

              <form onSubmit={handleCreateRequest} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                
                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                        <Zap className="w-3.5 h-3.5 fill-indigo-600" /> Sagens Kerne
                    </div>
                    <div className="space-y-4">
                        <input required type="text" placeholder="Titel på sagen..." className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-lg font-black text-slate-900 serif outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        <textarea required rows={4} placeholder="Beskriv problemstillingen i detaljer..." className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        <div className="grid grid-cols-2 gap-6">
                            <select className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as any})} >
                                <option value="Rådgivning">Rådgivning</option>
                                <option value="Ansøgning">Ansøgning</option>
                                <option value="Bisidder">Bisidder</option>
                                <option value="Andet">Andet</option>
                            </select>
                            <div className="relative">
                                <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input required type="number" className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600/30 transition-all" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-orange-600 bg-orange-50 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        <User className="w-3.5 h-3.5" /> Klient Detaljer
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <input required type="text" placeholder="Fulde navn" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none transition-all focus:border-orange-200" value={formData.citizenName} onChange={(e) => setFormData({...formData, citizenName: e.target.value})} />
                        <input required type="email" placeholder="E-mail adresse" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none transition-all focus:border-orange-200" value={formData.citizenEmail} onChange={(e) => setFormData({...formData, citizenEmail: e.target.value})} />
                    </div>
                </section>

                <div className="pt-4 flex items-center justify-end gap-6">
                  <Button type="button" onClick={() => !isSubmitting && setShowCreateModal(false)} variant="ghost" className="rounded-[1.5rem] px-8 h-16 font-black uppercase tracking-widest text-[11px] text-slate-400">Annuller</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800 rounded-[2rem] px-12 h-20 font-black uppercase tracking-widest text-[12px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Deploy Case'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMarkedspladsPage;

