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
  Eye,
  AlertCircle,
  TrendingUp,
  HandHelping,
  CreditCard,
  User,
  ShieldCheck,
  ChevronDown,
  ArrowUpDown,
  Star,
  Banknote,
  FileSpreadsheet,
  UserMinus,
  Plus,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { AssistanceRequest } from '@/ai/flows/types';
import { sendTaskResetEmailAction } from '@/app/actions';
import { createAssistanceRequestAction } from '@/app/markedsplads/actions';
import { motion, AnimatePresence } from 'framer-motion';

const STAT_CARDS = [
  { label: 'Totale Opgaver', key: 'total', icon: HandHelping, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'I Gang', key: 'claimed', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Betalt', key: 'paid', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Afsluttet', key: 'completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

  const { data: requests, isLoading, error } = useCollection<AssistanceRequest>(requestsQuery);

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
    if (!firestore || !window.confirm('Vil du nulstille denne opgave? Den studerende vil blive fjernet, og opgaven bliver åben for andre igen.')) return;
    try {
      await updateDoc(doc(firestore, 'assistance_requests', req.id), {
        status: 'open',
        studentId: null,
        studentName: null,
        studentEmail: null,
        studentPhone: null,
        claimedAt: null
      });

      if (req.citizenEmail) {
        await sendTaskResetEmailAction(req.citizenEmail, req.title);
      }

      toast({ title: 'Opgave nulstillet og borger adviseret' });
    } catch (err) {
      toast({ title: 'Fejl ved nulstilling', variant: 'destructive' });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!firestore || !window.confirm('Er du sikker på du vil slette denne opgave?')) return;
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
      await updateDoc(doc(firestore, 'assistance_requests', req.id), {
        isPaid: !req.isPaid
      });
      toast({ title: `Betaling markeret som ${!req.isPaid ? 'gennemført' : 'afventende'}` });
    } catch (err) {
      toast({ title: 'Fejl ved opdatering', variant: 'destructive' });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.title || !formData.description || !formData.citizenName || !formData.citizenEmail || !formData.price) {
      toast({ title: 'Venligst udfyld alle påkrævede felter', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAssistanceRequestAction(formData as any);
      if (result.success) {
        toast({ title: 'Opgave oprettet manuelt' });
        setShowCreateModal(false);
        setFormData({
            title: '',
            description: '',
            category: 'Rådgivning',
            price: 500,
            location: '',
            citizenName: '',
            citizenEmail: '',
            citizenPhone: '',
            dueDate: ''
        });
      } else {
        toast({ title: result.error || 'Fejl ved oprettelse', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Serverfejl ved oprettelse', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-bold text-slate-900 serif">Markedsplads Administration</h3>
          <p className="text-sm text-slate-500 mt-1 font-medium italic">Overvåg opgaver, transaktioner og udbetalinger på tværs af platformen.</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-950 text-amber-400 hover:bg-slate-900 rounded-2xl flex items-center gap-2 px-6 py-6 shadow-xl shadow-amber-950/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Opret manuel sag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((statCard) => {
          const Icon = statCard.icon;
          return (
            <div key={statCard.key} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statCard.bg} ${statCard.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-bold mb-1">{statCard.label}</p>
                <p className="text-3xl font-black text-slate-900">
                  {isLoading ? '...' : stats[statCard.key as keyof typeof stats]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative group w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Søg i titler, borgere eller studerende..."
                className="pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm w-full font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Alle Statusser</option>
                  <option value="open">Åbne</option>
                  <option value="claimed">I Gang</option>
                  <option value="paid">Betalt</option>
                  <option value="completed">Afsluttet</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Nyeste</option>
                  <option value="price_desc">Højeste Pris</option>
                  <option value="price_asc">Laveste Pris</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Indlæser markedsplads...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
               <HandHelping className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ingen opgaver fundet</h3>
            <p className="text-slate-400 text-sm max-w-sm">Ingen opgaver matcher dine filtre lige nu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Opgave</th>
                  <th className="px-8 py-5">Borger / Kontakt</th>
                  <th className="px-8 py-5">Studerende</th>
                  <th className="px-8 py-5">Økonomi</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right pr-12">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="max-w-xs">
                        <p className="font-bold text-slate-900 mb-1 truncate">{req.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 w-fit px-2 py-0.5 rounded">
                          {req.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {req.citizenName?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{req.citizenName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{req.citizenEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {req.studentId ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                            {req.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-900">{req.studentName}</p>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-indigo-400">Påtager</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">Ikke taget endnu</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{req.price} kr.</p>
                        <p className="text-[9px] font-bold text-emerald-600">Studerende: {req.studentEarnings} kr.</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        {req.status === 'completed' ? (
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Afsluttet</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= (req.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        ) : req.isPaid ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 w-fit">
                            <CreditCard className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Betalt</span>
                          </div>
                        ) : req.status === 'claimed' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100 w-fit">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">I Gang</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 w-fit">
                            <HandHelping className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Åben</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.studentId && (
                           <button 
                            onClick={() => window.location.href = `/admin/users?search=${req.studentName}`}
                            title="Se udbetalingsoplysninger"
                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all"
                          >
                            <Banknote className="w-4 h-4" />
                          </button>
                        )}
                        {req.studentId && (
                           <button 
                            onClick={() => handleResetRequest(req)}
                            title="Fjern studerende (Nulstil opgave)"
                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleTogglePayment(req)}
                          className={`p-2 rounded-xl border transition-all ${req.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'}`}
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                    <HandHelping className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Opret Manuel Sag</h3>
                    <p className="text-xs text-slate-400 font-medium">Udfyld formularen for at oprette en sag på vegne af en borger.</p>
                  </div>
                </div>
                <button 
                  onClick={() => !isSubmitting && setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 block px-1">Opgave Detaljer</label>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Titel</label>
                        <input 
                          required
                          type="text" 
                          placeholder="F.eks. Hjælp til ankesag om merudgifter"
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all outline-none"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Beskrivelse</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Beskriv opgaven i detaljer..."
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all outline-none resize-none"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 px-1">Kategori</label>
                          <select 
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                          >
                            <option value="Rådgivning">Rådgivning</option>
                            <option value="Ansøgning">Ansøgning</option>
                            <option value="Bisidder">Bisidder</option>
                            <option value="Andet">Andet</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 px-1">Pris (DKK)</label>
                          <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              required
                              type="number" 
                              className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all outline-none"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Info */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 block px-1">Borger Information</label>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Navn</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            required
                            type="text" 
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.citizenName}
                            onChange={(e) => setFormData({...formData, citizenName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            required
                            type="email" 
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.citizenEmail}
                            onChange={(e) => setFormData({...formData, citizenEmail: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Telefon</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="tel" 
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.citizenPhone}
                            onChange={(e) => setFormData({...formData, citizenPhone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 block px-1">Praktiske Detaljer</label>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Lokation</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="F.eks. København eller Online"
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 px-1">Deadline</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="date" 
                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-amber-500/5"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                  <Button 
                    type="button"
                    onClick={() => !isSubmitting && setShowCreateModal(false)}
                    variant="ghost"
                    className="rounded-2xl px-8 h-14 font-bold text-slate-500"
                  >
                    Annuller
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-950 text-amber-400 hover:bg-slate-900 rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-amber-950/20 active:scale-95 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Opretter...
                      </>
                    ) : (
                      'Opret Opgave Nu'
                    )}
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
