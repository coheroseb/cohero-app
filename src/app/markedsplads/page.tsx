'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  HandHelping, 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle,
  MapPin,
  Calendar,
  Loader2, 
  X,
  CreditCard,
  User,
  AlertCircle,
  Mail,
  Phone,
  DollarSign,
  ShieldCheck,
  Lock,
  Clock
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc, 
  serverTimestamp, 
  addDoc, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';
import { AssistanceRequest } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { encryptData, decryptData } from '@/lib/encryption';
import { claimAssistanceRequestAction } from '@/app/markedsplads/actions';

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee

const AssistanceMarketplaceContent = () => {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'claimed'>('all');
  
  const [showPayoutInfoModal, setShowPayoutInfoModal] = useState(false);

  const [payoutFormData, setPayoutFormData] = useState({
    fullName: '',
    address: '',
    cprNumber: '',
    bankReg: '',
    bankAccount: '',
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const filter = searchParams?.get('activeFilter');
    if (filter === 'mine' || filter === 'claimed' || filter === 'all') {
      setActiveFilter(filter as any);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadPayoutInfo() {
      if (userProfile?.cprNumber && userProfile?.bankReg && userProfile?.bankAccount) {
        try {
          const [cpr, reg, account, name, addr] = await Promise.all([
            decryptData(userProfile.cprNumber),
            decryptData(userProfile.bankReg),
            decryptData(userProfile.bankAccount),
            userProfile.payoutFullName ? decryptData(userProfile.payoutFullName) : Promise.resolve(''),
            userProfile.payoutAddress ? decryptData(userProfile.payoutAddress) : Promise.resolve('')
          ]);
          setPayoutFormData({
            fullName: name,
            address: addr,
            cprNumber: cpr,
            bankReg: reg,
            bankAccount: account
          });
        } catch (err) {
          console.error("Failed to decrypt payout info:", err);
          setPayoutFormData({
            fullName: '',
            address: '',
            cprNumber: userProfile.cprNumber || '',
            bankReg: userProfile.bankReg || '',
            bankAccount: userProfile.bankAccount || '',
          });
        }
      }
    }
    loadPayoutInfo();
  }, [userProfile]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'assistance_requests'), orderBy('createdAt', 'desc'));
    
    if (activeFilter === 'mine') {
      q = query(collection(firestore, 'assistance_requests'), where('citizenId', '==', user?.uid));
    } else if (activeFilter === 'claimed') {
        q = query(collection(firestore, 'assistance_requests'), where('studentId', '==', user?.uid));
    }
    
    return q;
  }, [firestore, activeFilter, user?.uid]);

  const { data: requests, isLoading: requestsLoading } = useCollection<AssistanceRequest>(requestsQuery);

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter(req => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (req.title?.toLowerCase() || '').includes(searchLower) || 
                           (req.description?.toLowerCase() || '').includes(searchLower);
      
      if (activeFilter === 'all') {
          return matchesSearch && req.status === 'open';
      }
      return matchesSearch;
    }).sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
    });
  }, [requests, searchQuery, activeFilter]);

  const handleMarkAsPaid = async (requestId: string) => {
    if (!firestore) return;
    try {
        await updateDoc(doc(firestore, 'assistance_requests', requestId), {
            isPaid: true,
        });
        alert("Betaling gennemført! Den studerende kan nu se dine kontaktoplysninger.");
    } catch (error) {
        console.error("Error updating payment: ", error);
        alert("Der opstod en fejl.");
    }
  };

  const handleClaimRequest = async (request: AssistanceRequest) => {
    if (!user || !userProfile) return;

    if (request.citizenId === user.uid) {
        alert("Du kan ikke tage din egen opgave!");
        return;
    }

    if (!userProfile?.cprNumber || !userProfile?.bankReg || !userProfile?.bankAccount) {
        setShowPayoutInfoModal(true);
        return;
    }

    if (!window.confirm(`Er du sikker på, at du vil tage denne opgave? Du tjener ${request.studentEarnings} DKK ved fuldførelse.`)) return;

    try {
        const result = await claimAssistanceRequestAction(request.id, {
            uid: user.uid,
            name: userProfile.username || user.displayName || 'Studerende'
        });
        
        if (result.success) {
            alert("Du har nu taget opgaven! Du kan finde den under 'Mine opgaver'.");
        } else {
            alert(result.error || "Der opstod en fejl.");
        }
    } catch (error) {
        console.error("Error claiming request: ", error);
        alert("Der opstod en fejl da du forsøgte at tage opgaven.");
    }
  };

  const handleSavePayoutInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    
    if (
        !payoutFormData.fullName || 
        !payoutFormData.address || 
        payoutFormData.cprNumber.length < 10 || 
        payoutFormData.bankReg.length < 4 || 
        payoutFormData.bankAccount.length < 5
    ) {
        alert("Venligst udfyld alle felter korrekt.");
        return;
    }

    try {
        const [encCpr, encReg, encAccount, encName, encAddr] = await Promise.all([
            encryptData(payoutFormData.cprNumber),
            encryptData(payoutFormData.bankReg),
            encryptData(payoutFormData.bankAccount),
            encryptData(payoutFormData.fullName),
            encryptData(payoutFormData.address)
        ]);

        await updateDoc(doc(firestore, 'users', user.uid), {
            cprNumber: encCpr,
            bankReg: encReg,
            bankAccount: encAccount,
            payoutFullName: encName,
            payoutAddress: encAddr,
            isHelperEnabled: true,
        });
        setShowPayoutInfoModal(false);
        alert("Dine udbetalingsoplysninger er krypteret og gemt sikkert. Du kan nu tage opgaver!");
    } catch (err) {
        console.error("Error saving payout info:", err);
        alert("Der opstod en fejl ved gem af dine oplysninger.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-rose-100">
      <header className="bg-white border-b border-amber-100 px-6 py-8 sticky top-24 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-3 bg-rose-50 text-rose-900 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 shadow-sm active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/60">Samfunds-Forbindelse</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-amber-950 serif tracking-tight">Markedsplads & Opgaver</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text" 
                placeholder="Søg i opgaver, emner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-amber-50 rounded-[1.5rem] focus:ring-4 focus:ring-rose-400/10 focus:border-rose-400 focus:outline-none transition-all shadow-sm text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-6 py-12 grid lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-48 h-fit">
          <section className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm space-y-6">
             <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" /> Din Oversigt
                </h4>
                <div className="grid gap-2">
                    {[
                        { id: 'all', label: 'Ledige opgaver', icon: Search },
                        { id: 'mine', label: 'Mine anmodninger', icon: HandHelping },
                        { id: 'claimed', label: 'Mine tagne opgaver', icon: CheckCircle2 }
                    ].map((btn) => (
                        <button 
                            key={btn.id}
                            onClick={() => setActiveFilter(btn.id as any)}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-3 ${
                                activeFilter === btn.id ? 'bg-amber-950 text-white shadow-xl translate-x-1' : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-950'
                            }`}
                        >
                            <btn.icon className={`w-4 h-4 ${activeFilter === btn.id ? 'text-amber-400' : 'text-slate-400'}`} />
                            {btn.label}
                        </button>
                    ))}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status
                </h4>
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    userProfile?.isHelperEnabled ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${userProfile?.isHelperEnabled ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className={`text-[11px] font-bold ${userProfile?.isHelperEnabled ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {userProfile?.isHelperEnabled ? 'Klar til opgaver' : 'Mangler udbetalings-info'}
                    </span>
                </div>
             </div>
          </section>

          <section className="p-8 bg-indigo-950 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <HandHelping className="w-24 h-24 -rotate-12" />
             </div>
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase text-indigo-300 mb-3 tracking-widest">Studerende?</h4>
                <p className="text-[13px] font-bold leading-relaxed mb-4">
                  Tjen penge ved at hjælpe borgere med deres sociale sager. Alt foregår sikkert gennem Cohéro.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                    <span>15% gebyr</span>
                    <div className="w-1 h-1 rounded-full bg-indigo-700" />
                    <span>Hurtig udbetaling</span>
                </div>
             </div>
          </section>
        </aside>
        
        <main className="lg:col-span-9 space-y-8">
           {requestsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-900"/></div>
           ) : (
             <div className="grid gap-6">
              {filteredRequests.map(req => (
                <div 
                  key={req.id}
                  className="bg-white rounded-[2.5rem] border border-amber-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between gap-10">
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                         <span className="px-5 py-2 bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                           {req.category}
                         </span>
                         {req.status === 'claimed' && (
                            <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 border ${
                                req.studentId === user?.uid ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> 
                              {req.studentId === user?.uid ? 'Taget af dig' : `Taget af ${req.studentName}`}
                            </span>
                         )}
                         {req.isPaid && (
                            <span className="px-5 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5" /> Betaling gennemført
                            </span>
                         )}
                      </div>

                      <h3 className="text-3xl font-extrabold text-amber-950 serif tracking-tight leading-tight group-hover:text-rose-900 transition-colors">
                        {req.title}
                      </h3>
                      <p className="text-slate-600 text-[15px] leading-relaxed max-w-2xl font-medium">
                        {req.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                           <div className="p-2.5 bg-slate-50 rounded-xl">
                                <MapPin className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold leading-none">{req.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                           <div className="p-2.5 bg-slate-50 rounded-xl">
                                <Calendar className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold leading-none">{req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Lige nu'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                           <div className="p-2.5 bg-slate-50 rounded-xl">
                                <User className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold leading-none">{req.citizenName}</span>
                        </div>
                      </div>

                      {req.status === 'claimed' && req.studentId === user?.uid && (
                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                             <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-rose-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-900">Kontaktoplysninger</span>
                             </div>
                             {req.isPaid ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                     <a href={`mailto:${req.citizenEmail}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-sm font-black text-rose-950">
                                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        {req.citizenEmail}
                                     </a>
                                     {req.citizenPhone && (
                                        <a href={`tel:${req.citizenPhone}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-sm font-black text-rose-950">
                                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            {req.citizenPhone}
                                        </a>
                                     )}
                                </div>
                             ) : (
                                <div className="flex items-center gap-3 text-[13px] font-bold text-rose-800">
                                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                      <Lock className="w-5 h-5" />
                                   </div>
                                   Oplysninger frigives når borgeren har gennemført betalingen.
                                </div>
                             )}
                        </div>
                      )}
                    </div>

                    <div className="md:w-72 bg-[#FDFCF8] rounded-[2.5rem] p-8 flex flex-col justify-between items-center text-center border border-amber-100 relative group-hover:bg-amber-50/50 transition-colors">
                        <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-amber-950 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                           Fast Pris
                        </div>

                       <div className="space-y-2 mt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Borger betaler</p>
                          <p className="text-5xl font-black text-amber-950 serif">{req.price} <span className="text-xl font-bold ml-1">kr.</span></p>
                       </div>
                       
                       <div className="w-full space-y-4">
                            {req.status === 'open' ? (
                                <button 
                                    onClick={() => handleClaimRequest(req)}
                                    disabled={req.citizenId === user?.uid}
                                    className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 ${
                                        req.citizenId === user?.uid 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                        : 'bg-amber-950 text-white hover:bg-rose-900 shadow-amber-950/20'
                                    }`}
                                >
                                    {req.citizenId === user?.uid ? 'Din egen opgave' : 'Påtag opgave'}
                                </button>
                            ) : req.status === 'claimed' && req.citizenId === user?.uid && !req.isPaid ? (
                                <button 
                                    onClick={() => handleMarkAsPaid(req.id)}
                                    className="w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <CreditCard className="w-4 h-4" /> Gå til betaling
                                </button>
                            ) : (
                                <div className={`flex items-center justify-center gap-2 p-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border ${
                                    req.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}>
                                    {req.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    {req.isPaid ? 'Gennemført' : 'Under behandling'}
                                </div>
                            )}
                            
                            <div className="p-4 bg-white/50 rounded-2xl border border-amber-100/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Du tjener (efter gebyr)</p>
                                <p className="text-lg font-black text-amber-900">{req.studentEarnings} kr.</p>
                            </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                    <HandHelping className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                    <p className="text-slate-400 italic">Ingen opgaver fundet.</p>
                </div>
              )}
             </div>
           )}
        </main>
      </div>


      {showPayoutInfoModal && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-amber-100 overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-950 serif">Udbetalings-info</h2>
                        <p className="text-slate-500 text-sm mt-1">Lovpligtig info for at modtage betaling (DAC7)</p>
                    </div>
                    <button onClick={() => setShowPayoutInfoModal(false)} className="p-2 hover:bg-rose-50 rounded-xl transition-all">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSavePayoutInfo} className="space-y-6">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Fulde Navn</label>
                           <input 
                              type="text" 
                              required 
                              placeholder="Dit fulde navn"
                              value={payoutFormData.fullName}
                              onChange={(e) => setPayoutFormData({...payoutFormData, fullName: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Adresse</label>
                           <input 
                              type="text" 
                              required 
                              placeholder="Vejnavn, nr., postnr. og by"
                              value={payoutFormData.address}
                              onChange={(e) => setPayoutFormData({...payoutFormData, address: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">CPR-Nummer</label>
                           <input 
                              type="text" 
                              required 
                              placeholder="DDMMYY-XXXX"
                              value={payoutFormData.cprNumber}
                              onChange={(e) => setPayoutFormData({...payoutFormData, cprNumber: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                           />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2 col-span-1">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Reg.</label>
                               <input 
                                  type="text" 
                                  required 
                                  placeholder="1234"
                                  value={payoutFormData.bankReg}
                                  onChange={(e) => setPayoutFormData({...payoutFormData, bankReg: e.target.value})}
                                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                               />
                           </div>
                           <div className="space-y-2 col-span-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Konto</label>
                               <input 
                                  type="text" 
                                  required 
                                  placeholder="12345678"
                                  value={payoutFormData.bankAccount}
                                  onChange={(e) => setPayoutFormData({...payoutFormData, bankAccount: e.target.value})}
                                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                               />
                           </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 italic">
                        <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0" />
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            Ved at gemme disse oplysninger accepterer du, at Cohéro indberetter din indkomst til Skattestyrelsen jf. DAC7-direktivet.
                        </p>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-5 bg-amber-950 text-white rounded-2xl font-bold shadow-lg hover:bg-rose-900 transition-all"
                    >
                      Gem og fortsæt
                    </button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AssistancePage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/auth?mode=login&callbackUrl=/markedsplads');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            <AssistanceMarketplaceContent />
        </div>
    );
};

export default AssistancePage;
