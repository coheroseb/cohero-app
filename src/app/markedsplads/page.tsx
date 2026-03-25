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
  Clock,
  UploadCloud,
  FilePlus,
  Check,
  Zap,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {   collection, 
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
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
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
    phoneNumber: '',
  });

  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);

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
              bankAccount: account,
              phoneNumber: userProfile.phoneNumber || ''
            });
          } catch (err) {
            console.error("Failed to decrypt payout info:", err);
            setPayoutFormData({
              fullName: '',
              address: '',
              cprNumber: userProfile.cprNumber || '',
              bankReg: userProfile.bankReg || '',
              bankAccount: userProfile.bankAccount || '',
              phoneNumber: userProfile.phoneNumber || ''
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

    if (!userProfile?.cprNumber || !userProfile?.bankReg || !userProfile?.bankAccount || !userProfile?.phoneNumber) {
        setShowPayoutInfoModal(true);
        return;
    }

    // Check for max 3 active tasks
    const activeTasks = requests?.filter(r => r.studentId === user.uid && r.status === 'claimed' && !r.isPaid) || [];
    if (activeTasks.length >= 3) {
        alert("Du har allerede 3 igangværende opgaver. Færdiggør dem før du tager nye.");
        return;
    }

    if (!window.confirm(`Er du sikker på, at du vil tage denne opgave? Du tjener ${request.studentEarnings} DKK ved fuldførelse.`)) return;

    try {
        const result = await claimAssistanceRequestAction(request.id, {
            uid: user.uid,
            name: userProfile.username || user.displayName || 'Studerende',
            phone: userProfile.phoneNumber || ''
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
        payoutFormData.bankAccount.length < 5 ||
        !payoutFormData.phoneNumber
    ) {
        alert("Venligst udfyld alle felter korrekt.");
        return;
    }

    if (!studentCardFile && !userProfile?.studentCardUrl) {
        alert("Du skal uploade et billede af dit studiekort.");
        return;
    }

    setIsUploadingCard(true);

    try {
        let studentCardUrl = userProfile?.studentCardUrl || '';

        if (studentCardFile && storage) {
            const fileName = `${user.uid}_${Date.now()}_${studentCardFile.name}`;
            const fileRef = ref(storage, `student_cards/${fileName}`);
            await uploadBytes(fileRef, studentCardFile);
            studentCardUrl = fileRef.fullPath; // Store the path instead of public download URL for better security
        }

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
            phoneNumber: payoutFormData.phoneNumber,
            studentCardUrl,
            isHelperEnabled: true,
        });
        await refetchUserProfile(); // Refresh the profile state immediately
        setShowPayoutInfoModal(false);
        setStudentCardFile(null);
        alert("Dine udbetalingsoplysninger er krypteret og gemt sikkert. Du kan nu tage opgaver!");
    } catch (err) {
        console.error("Error saving payout info:", err);
        alert("Der opstod en fejl ved gem af dine oplysninger.");
    } finally {
        setIsUploadingCard(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore || !storage) return;

    // Check file type (PDF, DOCX)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      alert("Venligst upload et CV i PDF eller Word-format.");
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Filen er for stor. Maks 5MB.");
      return;
    }

    setIsUploadingCV(true);
    try {
      const fileName = `cv_${user.uid}_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `cvs/${fileName}`);
      await uploadBytes(fileRef, file);
      const cvUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(firestore, 'users', user.uid), {
        cvUrl,
        cvName: file.name,
        cvUpdatedAt: serverTimestamp()
      });

      await refetchUserProfile();
      alert("Dit CV er blevet uploadet!");
    } catch (err) {
      console.error("Error uploading CV:", err);
      alert("Der opstod en fejl ved upload af dit CV.");
    } finally {
      setIsUploadingCV(false);
    }
  };

  if (userProfile?.isMarketplaceBanned) {
      return (
          <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
              <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border-2 border-rose-200 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-rose-100">
                      <ShieldCheck className="w-12 h-12" />
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-4xl font-black text-slate-900 serif">Adgang Nægtet</h1>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                          Du er blevet udelukket fra Cohéro Markedspladsen af en administrator.
                      </p>
                      <div className="p-8 bg-rose-50/50 rounded-[2rem] border border-rose-100 text-left">
                          <p className="text-[10px] font-black uppercase text-rose-900 tracking-widest mb-3">Begrundelse for udelukkelse</p>
                          <p className="text-sm font-bold text-rose-800 leading-relaxed italic">"{userProfile.marketplaceBanReason}"</p>
                      </div>
                      <p className="text-xs text-slate-400 font-medium pt-4">
                          Mener du dette er en fejl? Kontakt os på <a href="mailto:kontakt@cohero.dk" className="text-rose-600 font-bold hover:underline">kontakt@cohero.dk</a>
                      </p>
                  </div>
                  <button onClick={() => router.push('/')} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-rose-950 transition-all active:scale-95">Gå til forsiden</button>
              </div>
          </div>
      );
  }
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-amber-100">
      {/* Dynamic Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-amber-50 sticky top-0 z-50 px-4 sm:px-8 py-4 sm:py-6 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-amber-950 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-[1px] bg-slate-100 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/60 leading-none">Live Markedsplads</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-950 serif tracking-tight flex items-center gap-3">
                Opgaver <span className="text-slate-200 font-light italic">/</span> <span className="text-slate-400 text-lg sm:text-2xl">Find hjælp</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-600 transition-colors" />
                <input
                  type="text" 
                  placeholder="Hvad leder du efter? Søg emner, ord..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-200 focus:outline-none transition-all shadow-inner text-sm font-semibold text-slate-900 placeholder:text-slate-300"
                />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-16 grid lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Modern Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-36 h-fit order-2 lg:order-1">
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-amber-100/50 shadow-2xl shadow-amber-950/5 space-y-8">
             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Kategorier
                </h4>
                <div className="flex flex-col gap-2">
                    {[
                        { id: 'all', label: 'Alle Ledige', icon: Zap, count: requests?.filter(r => r.status === 'open').length || 0 },
                        { id: 'mine', label: 'Mine Oprettede', icon: User, count: requests?.filter(r => r.citizenId === user?.uid).length || 0 },
                        { id: 'claimed', label: 'Mine Tagne', icon: Briefcase, count: requests?.filter(r => r.studentId === user?.uid).length || 0 }
                    ].map((btn) => (
                        <button 
                            key={btn.id}
                            onClick={() => setActiveFilter(btn.id as any)}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/nav ${
                                activeFilter === btn.id 
                                ? 'bg-amber-950 text-white shadow-xl shadow-amber-950/20' 
                                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <btn.icon className={`w-4 h-4 transition-transform group-hover/nav:scale-110 ${activeFilter === btn.id ? 'text-amber-400' : 'text-slate-300'}`} />
                                {btn.label}
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeFilter === btn.id ? 'bg-amber-900 text-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                                {btn.count}
                            </span>
                        </button>
                    ))}
                </div>
             </div>

             <div className="pt-8 border-t border-slate-50">
                <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${
                    userProfile?.isHelperEnabled 
                    ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' 
                    : 'bg-amber-50 border-amber-100 animate-pulse'
                }`}>
                    <div className={`w-3 h-3 rounded-full shadow-sm ${userProfile?.isHelperEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${userProfile?.isHelperEnabled ? 'text-emerald-900' : 'text-amber-900'}`}>
                            {userProfile?.isHelperEnabled ? 'Verificeret' : 'Uverificeret'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                             {userProfile?.isHelperEnabled ? 'Klar til udbetaling' : 'Mangler bank-data'}
                        </span>
                    </div>
                </div>
             </div>
          </div>

          <div className="group p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <HandHelping className="w-32 h-32 -rotate-12" />
             </div>
             <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 bg-amber-400/20 text-amber-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black serif">Socialrådgiver studerende?</h4>
                <p className="text-[12px] font-medium text-slate-400 leading-relaxed">
                  Tjen penge ved at hjælpe med faglige opslag, ansøgninger og meget mere. 
                </p>
                <div className="flex items-center gap-2 pt-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800" />
                        ))}
                    </div>
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-tighter">+50 aktive hjælpere</span>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-amber-100/50 shadow-2xl shadow-amber-950/5 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                   <FilePlus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-amber-950">Mit CV</h4>
             </div>

             {userProfile?.cvUrl ? (
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Uploadet fil</p>
                         <p className="text-xs font-bold text-slate-900 truncate">{userProfile.cvName || 'cv.pdf'}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={userProfile.cvUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-200/50"
                      >
                         Se CV
                      </a>
                      <label className="flex items-center justify-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer">
                         Skift
                         <input type="file" className="hidden" onChange={handleCVUpload} disabled={isUploadingCV} />
                      </label>
                   </div>
                </div>
             ) : (
                <div className="space-y-4">
                   <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                      Upload dit CV for at gøre det nemmere for borgere at vælge dig til opgaver.
                   </p>
                   <label className="flex items-center justify-center gap-3 py-4 bg-amber-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-950 shadow-xl shadow-amber-950/20 transition-all cursor-pointer active:scale-95">
                      {isUploadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      {isUploadingCV ? 'Uploader...' : 'Upload CV'}
                      <input type="file" className="hidden" onChange={handleCVUpload} disabled={isUploadingCV} />
                   </label>
                </div>
             )}
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6 sm:space-y-8 order-1 lg:order-2">
           {requestsLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-950" />
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Henter opgaver...</p>
             </div>
           ) : (
             <div className="grid gap-6 sm:gap-10">
              {filteredRequests.map(req => (
                <div 
                  key={req.id}
                  className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/50 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-amber-950/5 transition-all duration-500 group relative"
                >
                  {/* Category Badge Floating */}
                  <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-10">
                    <span className="px-5 py-2.5 bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl">
                        {req.category}
                    </span>
                    {req.isPaid && (
                        <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                  </div>

                  <div className="p-8 sm:p-14 flex flex-col md:flex-row gap-10 sm:gap-16">
                    <div className="flex-1 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                           {req.status === 'claimed' && (
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-2 border ${
                                    req.studentId === user?.uid ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${req.studentId === user?.uid ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                  {req.studentId === user?.uid ? 'Taget af dig' : `Optaget`}
                                </div>
                           )}
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                             <Calendar className="w-3.5 h-3.5" />
                             {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Lige nu'}
                           </div>
                        </div>

                        <h3 className="text-3xl sm:text-4xl font-black text-amber-950 serif tracking-tight leading-[1.1] max-w-xl group-hover:text-amber-900 transition-colors">
                          {req.title}
                        </h3>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg line-clamp-3">
                          {req.description}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 pt-10 border-t border-slate-50">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Lokation</p>
                            <div className="flex items-center gap-2 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-sm font-black">{req.location}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Fulde Navn</p>
                            <div className="flex items-center gap-2 text-slate-700">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-sm font-bold">{req.citizenName}</span>
                            </div>
                        </div>
                        {req.dueDate && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Frist</p>
                             <div className="flex items-center gap-2 text-rose-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="text-sm font-black">{req.dueDate}</span>
                             </div>
                          </div>
                        )}
                      </div>

                      {req.status === 'claimed' && req.studentId === user?.uid && (
                        <div className="mt-8 bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 animate-in slide-in-from-bottom-4 duration-700 shadow-inner">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Kontaktoplysninger Modtaget</span>
                                </div>
                                {!req.isPaid && <div className="text-[10px] font-bold text-rose-600 italic">Afventer betaling...</div>}
                             </div>

                             {req.isPaid ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                     <a href={`mailto:${req.citizenEmail}`} className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-sm font-black text-slate-900 border border-slate-50">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        {req.citizenEmail}
                                     </a>
                                     {req.citizenPhone && (
                                        <a href={`tel:${req.citizenPhone}`} className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-sm font-black text-slate-900 border border-slate-50">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <Phone className="w-6 h-6" />
                                            </div>
                                            {req.citizenPhone}
                                        </a>
                                     )}
                                </div>
                             ) : (
                                <div className="p-8 bg-white/50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4">
                                   <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200">
                                      <Lock className="w-8 h-8 text-slate-200" />
                                   </div>
                                   <p className="text-xs font-bold text-slate-400 max-w-xs leading-relaxed">
                                      Oplysninger frigives straks når borgeren har bekræftet hjælpen med betaling.
                                   </p>
                                </div>
                             )}
                        </div>
                      )}
                    </div>

                    <div className="md:w-80 flex flex-col gap-6">
                        <div className="bg-slate-50 rounded-[3rem] p-8 sm:p-10 flex flex-col items-center text-center border border-slate-100 flex-1 justify-center relative shadow-inner">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Budget</p>
                                <div className="flex items-baseline gap-1 justify-center">
                                    <span className="text-5xl sm:text-6xl font-black text-slate-950 serif">{req.price}</span>
                                    <span className="text-xl font-bold text-slate-400 tracking-tighter">DKK</span>
                                </div>
                            </div>
                            
                            <div className="w-full h-[1px] bg-slate-200 my-8 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-2 px-2 bg-slate-50 text-[8px] font-black uppercase text-slate-300">Optjening</div>
                            </div>

                            <div className="space-y-4 w-full">
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Du tjener</span>
                                    <span className="text-2xl font-black text-amber-950 serif">{req.studentEarnings} kr.</span>
                                </div>
                                <div className="p-4 bg-white/80 rounded-2xl border border-white text-[9px] font-medium text-slate-400 italic">
                                    Efter 15% platform-gebyr
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {req.status === 'open' ? (
                                <button 
                                    onClick={() => handleClaimRequest(req)}
                                    disabled={req.citizenId === user?.uid}
                                    className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] transition-all shadow-2xl active:scale-95 ${
                                        req.citizenId === user?.uid 
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                                        : 'bg-amber-950 text-white hover:bg-rose-950 shadow-amber-950/20'
                                    }`}
                                >
                                    {req.citizenId === user?.uid ? 'Din Egen Opgave' : 'Påtag Opgave'}
                                </button>
                            ) : req.status === 'claimed' && req.citizenId === user?.uid && !req.isPaid ? (
                                <button 
                                    onClick={() => handleMarkAsPaid(req.id)}
                                    className="w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <CreditCard className="w-5 h-5" /> Bekræft Hjælp
                                </button>
                            ) : (
                                <div className={`flex items-center justify-center gap-3 p-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                    req.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'
                                }`}>
                                    {req.isPaid ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    {req.isPaid ? 'Gennemført' : 'Igangværende'}
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="py-24 sm:py-32 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200/50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
                        <HandHelping className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 serif mb-2">Ingen opgaver lige nu</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Prøv at ændre din søgning eller tjek tilbage senere for nye opslag.</p>
                </div>
              )}
             </div>
           )}
        </main>
      </div>

      {showPayoutInfoModal && (
        <div className="fixed inset-0 bg-amber-950/40 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
          <div className="bg-white/95 rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50 animate-in zoom-in-95 duration-500 scrollbar-hide">
             <div className="p-8 sm:p-16 space-y-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-amber-950 text-amber-400 rounded-lg flex items-center justify-center shadow-lg">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40">Erhvervs Profil</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-amber-950 serif tracking-tight">Udbetalingsoplysninger</h2>
                        <p className="text-slate-400 text-sm mt-2 font-medium max-w-md">Vi har brug for dine detaljer for at kunne udbetale din indtjening sikkert og lovligt.</p>
                    </div>
                    <button onClick={() => setShowPayoutInfoModal(false)} className="group p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all active:scale-90">
                        <X className="w-6 h-6 text-slate-300 group-hover:text-rose-400 transition-colors" />
                    </button>
                </div>
 
                <form onSubmit={handleSavePayoutInfo} className="space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* PERSONAL INFORMATION SECTION */}
                        <div className="space-y-8">
                            <div>
                               <h3 className="text-[10px] font-black uppercase text-amber-950/30 tracking-widest mb-6 border-b border-amber-50 pb-2">Personlige Oplysninger</h3>
                               <div className="space-y-5">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Fulde Navn</label>
                                       <input 
                                          type="text" 
                                          required 
                                          placeholder="Dit fulde navn"
                                          value={payoutFormData.fullName}
                                          onChange={(e) => setPayoutFormData({...payoutFormData, fullName: e.target.value})}
                                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900"
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
                                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900"
                                       />
                                    </div>
            
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">CPR-Nummer</label>
                                           <input 
                                              type="text" 
                                              required 
                                              placeholder="DDMMYY-XXXX"
                                              value={payoutFormData.cprNumber}
                                              onChange={(e) => setPayoutFormData({...payoutFormData, cprNumber: e.target.value})}
                                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900"
                                           />
                                        </div>
                
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Telefonnummer</label>
                                           <input 
                                              type="tel" 
                                              required 
                                              placeholder="+45 12 34 56 78"
                                              value={payoutFormData.phoneNumber}
                                              onChange={(e) => setPayoutFormData({...payoutFormData, phoneNumber: e.target.value})}
                                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900"
                                           />
                                        </div>
                                    </div>
                               </div>
                            </div>
                        </div>

                        {/* BANK & ID SECTION */}
                        <div className="space-y-8">
                            <div>
                               <h3 className="text-[10px] font-black uppercase text-amber-950/30 tracking-widest mb-6 border-b border-amber-50 pb-2">Bank & Studiekort</h3>
                               <div className="space-y-6">
                                    <div className="grid grid-cols-4 gap-4">
                                       <div className="space-y-2 col-span-1">
                                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Reg.</label>
                                           <input 
                                              type="text" 
                                              required 
                                              placeholder="1234"
                                              value={payoutFormData.bankReg}
                                              onChange={(e) => setPayoutFormData({...payoutFormData, bankReg: e.target.value})}
                                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900 text-center"
                                           />
                                       </div>
                                       <div className="space-y-2 col-span-3">
                                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Konto</label>
                                           <input 
                                              type="text" 
                                              required 
                                              placeholder="12345678"
                                              value={payoutFormData.bankAccount}
                                              onChange={(e) => setPayoutFormData({...payoutFormData, bankAccount: e.target.value})}
                                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-bold text-slate-900"
                                           />
                                       </div>
                                    </div>
            
                                    <div className="space-y-4">
                                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Upload Studiekort</label>
                                       <div 
                                          className={`relative border-2 border-dashed rounded-[2rem] p-8 text-center transition-all ${studentCardFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200'}`}
                                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                          onDrop={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const file = e.dataTransfer.files?.[0];
                                              if (file && file.type.startsWith('image/')) {
                                                  setStudentCardFile(file);
                                              }
                                          }}
                                       >
                                          <input 
                                             type="file" 
                                             accept="image/*" 
                                             className="absolute inset-0 opacity-0 cursor-pointer" 
                                             onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setStudentCardFile(file);
                                             }}
                                          />
                                          {studentCardFile ? (
                                             <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                   <Check className="w-6 h-6" />
                                                </div>
                                                <div>
                                                   <p className="text-xs font-bold text-emerald-900">{studentCardFile.name}</p>
                                                   <p className="text-[10px] text-emerald-600">Klik for at ændre billede</p>
                                                </div>
                                             </div>
                                          ) : (
                                             <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center shadow-sm">
                                                   <UploadCloud className="w-6 h-6" />
                                                </div>
                                                <div>
                                                   <p className="text-xs font-bold text-slate-600">Træk dit studiekort her</p>
                                                   <p className="text-[10px] text-slate-400">Kun billedfiler (JPG, PNG)</p>
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                       {userProfile?.studentCardUrl && !studentCardFile && (
                                          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                             <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                             <span className="text-[11px] text-emerald-900 font-bold italic">Studiekort er allerede uploadet</span>
                                          </div>
                                       )}
                                    </div>
                               </div>
                            </div>
                        </div>
                    </div>
 
                    <div className="space-y-6">
                        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex gap-4">
                            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-900">Juridisk Note (DAC7)</p>
                                <p className="text-[11px] text-blue-800/70 leading-relaxed">
                                    Ved at gemme disse oplysninger accepterer du, at Cohéro indberetter din indkomst til Skattestyrelsen jf. DAC7-direktivet. Dine oplysninger er krypteret og gemt sikkert.
                                </p>
                            </div>
                        </div>
    
                        <button 
                            type="submit"
                            disabled={isUploadingCard}
                            className="w-full py-6 bg-amber-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amber-950/20 hover:bg-rose-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                          {isUploadingCard ? (
                             <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploader Informationer...
                             </>
                          ) : 'Bekræft og Gem Oplysninger'}
                        </button>
                    </div>
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
