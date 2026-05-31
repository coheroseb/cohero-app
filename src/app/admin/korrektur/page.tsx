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
  Loader2,
  CreditCard,
  Send,
  ExternalLink,
  Trash2,
  Bell
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProofreadingRequestStatusAction, sendKorrekturPaymentLinkAction, sendKorrekturReminderAction, deleteProofreadingRequestAction } from '@/app/actions';

export default function AdminKorrekturPage() {
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [descInput, setDescInput] = useState<string>('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [submittingReminders, setSubmittingReminders] = useState<Record<string, boolean>>({});

  const handleSendReminder = async (req: any) => {
    if (!window.confirm(`Vil du sende en påmindelse (rykkermail) til ${req.name} (${req.email})?`)) {
      return;
    }
    setSubmittingReminders(prev => ({ ...prev, [req.id]: true }));
    try {
      const res = await sendKorrekturReminderAction(req.id);
      if (res.success) {
        alert('Rykkermail er sendt til kunden!');
      } else {
        alert(res.message || 'Der opstod en fejl under afsendelse af rykker.');
      }
    } catch (err: any) {
      alert(err.message || 'Der opstod en fejl.');
    } finally {
      setSubmittingReminders(prev => ({ ...prev, [req.id]: false }));
    }
  };


  const openPaymentPanel = (req: any) => {
    setActiveReqId(req.id);
    setPriceInput(req.estimatedPrice.toString());
    setDescInput(`Korrekturlæsning – ${req.charCount.toLocaleString('da-DK')} tegn / deadline d. ${req.deadline}`);
    setSubmitMessage('');
    setSubmitSuccess(null);
  };

  const handleSendPaymentLink = async (req: any) => {
    setIsSubmittingLink(true);
    setSubmitMessage('Genererer betalingslink og sender mail...');
    setSubmitSuccess(null);
    try {
      const res = await sendKorrekturPaymentLinkAction({
        requestId: req.id,
        customerName: req.name,
        customerEmail: req.email,
        amountDkk: parseFloat(priceInput),
        description: descInput
      });
      if (res.success) {
        setSubmitSuccess(true);
        setSubmitMessage('Betalingslinket er oprettet og sendt til kunden!');
        setTimeout(() => {
          setActiveReqId(null);
        }, 3000);
      } else {
        setSubmitSuccess(false);
        setSubmitMessage(res.message || 'Der opstod en fejl.');
      }
    } catch (err: any) {
      setSubmitSuccess(false);
      setSubmitMessage(err.message || 'Der opstod en uventet fejl.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

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

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne anmodning? Denne handling kan ikke fortrydes.')) {
      return;
    }
    try {
      const res = await deleteProofreadingRequestAction(id);
      if (!res.success) {
        alert(res.message || 'Der opstod en fejl under sletning.');
      }
    } catch (err: any) {
      alert(err.message || 'Der opstod en fejl.');
    }
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900 serif leading-none">{req.name}</h3>
                        {req.reminderCount > 0 && (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                            <Bell className="w-2.5 h-2.5 animate-pulse" />
                            {req.reminderCount} {req.reminderCount === 1 ? 'rykker' : 'rykkere'}
                            {req.reminderSentAt && ` (d. ${req.reminderSentAt.toDate ? req.reminderSentAt.toDate().toLocaleDateString('da-DK') : new Date(req.reminderSentAt).toLocaleDateString('da-DK')})`}
                          </span>
                        )}
                      </div>
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

                  {activeReqId === req.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/50 mt-4 space-y-4 text-left"
                    >
                      <h4 className="text-xs font-black text-indigo-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Generer Stripe betalingslink & send mail
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Pris (DKK)</label>
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="f.eks. 350"
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Beskrivelse</label>
                          <input
                            type="text"
                            value={descInput}
                            onChange={(e) => setDescInput(e.target.value)}
                            placeholder="f.eks. Opgavekorrektur"
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                      
                      {submitMessage && (
                        <p className={`text-xs font-bold ${submitSuccess === true ? 'text-emerald-600' : submitSuccess === false ? 'text-rose-500' : 'text-slate-500'}`}>
                          {submitMessage}
                        </p>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveReqId(null)}
                          className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                        >
                          Annuller
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingLink}
                          onClick={() => handleSendPaymentLink(req)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          {isSubmittingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Generer & Send
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-3">
                   {req.paymentUrl && (
                     <>
                       <a
                         href={req.paymentUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-colors text-xs font-black uppercase tracking-widest"
                         title="Vis betalingslink"
                       >
                         <ExternalLink className="w-4 h-4" />
                         Link
                       </a>
                       <button
                         onClick={() => handleSendReminder(req)}
                         disabled={submittingReminders[req.id]}
                         className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl hover:bg-amber-100 transition-colors text-xs font-black uppercase tracking-widest disabled:opacity-50"
                         title="Send rykkermail"
                       >
                         {submittingReminders[req.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                         Rykker
                       </button>
                     </>
                   )}
                   <button
                     onClick={() => openPaymentPanel(req)}
                     className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-colors text-xs font-black uppercase tracking-widest"
                   >
                     <CreditCard className="w-4 h-4" />
                     {req.paymentUrl ? 'Send nyt' : 'Send link'}
                   </button>
                    <a 
                     href={`mailto:${req.email}?subject=Vedr. din forespørgsel på korrektur`}
                     className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-amber-600 transition-colors shadow-lg animate-all"
                     title="Send e-mail"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-lg"
                      title="Slet anmodning"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
