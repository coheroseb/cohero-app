
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { 
  Loader2, Search, Trash2, ChevronDown, Briefcase, User, Shield, Zap,
  Users, TrendingUp, Activity, Crown, Filter, ArrowUpDown, Calendar, ChevronLeft, ChevronRight, CreditCard, Eye, EyeOff, AlertCircle,
  CheckCircle2, XCircle, GraduationCap, Music, Facebook, Globe, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import DeleteUserModal from '@/components/DeleteUserModal';
import { useDebounce } from 'use-debounce';
import { decryptData } from '@/lib/encryption';
import { scanStudentCardAction, updateStudentCardVerificationAction, toggleMarketplaceBanAction, clearUserPaymentInfoAction, adminDeleteUserAction } from '@/app/actions';

import { StudentCardVerification } from '@/ai/flows/types';
import { calculateStudyStarted } from '@/lib/education';
import { writeBatch, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  institution?: string;
  semester?: string;
  membership?: string;
  cohéroPoints?: number;
  lastLogin?: { toDate: () => Date };
  lastActivityAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  role?: 'admin' | 'user';
  cprNumber?: string;
  bankReg?: string;
  bankAccount?: string;
  studentCardUrl?: string;
  studentCardVerification?: StudentCardVerification;
  isMarketplaceBanned?: boolean;
  marketplaceBanReason?: string;
  isQualified?: boolean;
  profession?: string;
  studyStarted?: string;
  conversionSource?: string;
  fbclid?: string;
  uf?: string;
  utm_source?: string;
  convertedAt?: { toDate: () => Date };
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  isPremium?: boolean;
}

const SourceBadge = ({ source }: { source?: string }) => {
    if (!source) return <div className="w-5 h-5 flex items-center justify-center text-slate-200" title="Organisk / Ukendt"><Compass className="w-3.5 h-3.5" /></div>;
    
    const config = {
        tiktok: { icon: Music, color: 'text-black', bg: 'bg-slate-100', label: 'TikTok' },
        facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Meta Ads' },
        google: { icon: Globe, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Google' },
        direct: { icon: Compass, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Direkte' }
    }[source.toLowerCase()] || { icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', label: source };

    const Icon = config.icon;

    return (
        <div className={`w-6 h-6 rounded-lg ${config.bg} ${config.color} flex items-center justify-center shadow-sm border border-black/5`} title={`Kilde: ${config.label}`}>
            <Icon className="w-3.5 h-3.5" />
        </div>
    );
};

const STAT_CARDS = [
  { label: 'Totale Brugere', key: 'total', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/50 border-indigo-100/50' },
  { label: 'Nye (30 dage)', key: 'new', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100/50' },
  { label: 'Aktive (24t)', key: 'active', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100/50' },
  { label: 'Premium', key: 'premium', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50/50 border-purple-100/50' },
];

const BankRow = ({ label, value }: { label: string, value?: string }) => {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleToggle = async () => {
    if (decrypted) {
      setDecrypted(null);
      return;
    }
    if (!value) return;
    setIsDecrypting(true);
    try {
      const result = await decryptData(value);
      setDecrypted(result);
    } catch (err) {
      setDecrypted("Fejl");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <p className="flex justify-between border-b border-white pb-2 group/bank">
      <span className="text-slate-500 font-medium">{label}:</span> 
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900 font-mono">
          {decrypted ? decrypted : value ? '••••••••' : '-'}
        </span>
        {value && (
          <button 
            onClick={handleToggle}
            className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
            title={decrypted ? "Skjul" : "Vis"}
          >
            {isDecrypting ? <Loader2 className="w-3 h-3 animate-spin"/> : decrypted ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
          </button>
        )}
      </div>
    </p>
  );
};

const StudentCardDisplay = ({ path, userId, userName }: { path: string, userId: string, userName?: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { storage } = { storage: useStorage() }; 

  useEffect(() => {
    if (!path) return;
    if (path.startsWith('http')) {
        setUrl(path);
        return;
    }

    const fetchUrl = async () => {
        if (!storage || !path) return;
        setIsLoading(true);
        setError(null);
        try {
            const fileRef = ref(storage, path);
            const downloadUrl = await getDownloadURL(fileRef);
            setUrl(downloadUrl);
        } catch (err) {
            console.error("Error fetching student card URL:", err);
            setError("Kunne ikke hente link");
        } finally {
            setIsLoading(false);
        }
    };

    fetchUrl();
  }, [path, storage]);

  if (!path) return <div className="text-center py-6 text-slate-400 italic text-[10px]">Intet studiekort uploadet.</div>;

  return (
    <div className="space-y-4">
        <div className="aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden relative group shadow-inner">
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
            ) : url ? (
                <>
                    <img src={url} alt="Studiekort" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    <a href={url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black uppercase tracking-widest transition-opacity backdrop-blur-sm">Vis fuld størrelse</a>
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-rose-400 text-[10px] font-bold">
                    {error || "Ingen adgang"}
                </div>
            )}
        </div>
    </div>
  );
};

const AdminUsersPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
  const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Filters & Sorting
  const [roleFilter, setRoleFilter] = useState('all');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); 
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate Statistics
  const stats = useMemo(() => {
    if (!users) return { total: 0, new: 0, active: 0, premium: 0 };
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const nonAdmins = users.filter(u => u.role !== 'admin');

    let newCount = 0;
    let activeCount = 0;

    nonAdmins.forEach(u => {
      const createdAt = u.createdAt?.toDate();
      const lastActivity = u.lastActivityAt?.toDate() || u.lastLogin?.toDate();

      if (createdAt && createdAt > thirtyDaysAgo) newCount++;
      if (lastActivity && lastActivity > twentyFourHoursAgo) activeCount++;
    });

    const premiumCount = nonAdmins.filter(u => {
        const mem = u.membership || '';
        return mem.includes('+') || mem === 'Semesterpakken' || mem === 'Group Pro';
    }).length;

    return { total: nonAdmins.length, new: newCount, active: activeCount, premium: premiumCount };
  }, [users]);

  // Filter & Sort Users
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];
    
    let result = [...users];

    // Search
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    if (lowercasedTerm) {
      result = result.filter(user => 
        (user.username || '').toLowerCase().includes(lowercasedTerm) ||
        (user.email || '').toLowerCase().includes(lowercasedTerm)
      );
    }

    // Role
    if (roleFilter !== 'all') {
      result = result.filter(user => (user.role || 'user') === roleFilter);
    }

    // Membership
    if (membershipFilter !== 'all') {
      if (membershipFilter === 'free') {
        result = result.filter(user => !user.membership || user.membership === 'Kollega' || user.membership === 'free');
      } else {
         result = result.filter(user => user.membership === membershipFilter);
      }
    }

    // Semester
    if (semesterFilter !== 'all') {
      if (semesterFilter === 'qualified') {
        result = result.filter(user => user.isQualified);
      } else {
        result = result.filter(user => user.semester?.toString().includes(semesterFilter));
      }
    }

    // Sort
    result.sort((a, b) => {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        const pointsA = a.cohéroPoints || 0;
        const pointsB = b.cohéroPoints || 0;
        const activityA = a.lastActivityAt?.toDate()?.getTime() || a.lastLogin?.toDate()?.getTime() || 0;
        const activityB = b.lastActivityAt?.toDate()?.getTime() || b.lastLogin?.toDate()?.getTime() || 0;

        switch (sortBy) {
            case 'oldest': return dateA - dateB;
            case 'points_desc': return pointsB - pointsA;
            case 'points_asc': return pointsA - pointsB;
            case 'last_active_desc': return activityB - activityA;
            case 'newest':
            default: return dateB - dateA;
        }
    });

    return result;
  }, [users, debouncedSearchTerm, roleFilter, membershipFilter, semesterFilter, sortBy]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter, membershipFilter, semesterFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / itemsPerPage));
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete || !firestore) return;

    try {
      const result = await adminDeleteUserAction(userToDelete.id);
      if (!result.success) throw new Error(result.error);
      
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      
      toast({
        title: 'Bruger slettet',
        description: `Brugeren ${userToDelete.username} er blevet slettet permanent.`,
      });
      setUserToDelete(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: err.message || 'Kunne ikke slette brugeren.',
      });
    }
  };

  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const handleBulkCalculateStartDates = async () => {
    if (!users || !firestore) return;
    setIsBulkLoading(true);
    const batch = writeBatch(firestore);
    let count = 0;

    users.forEach(u => {
        if (!u.isQualified && u.semester && !u.studyStarted) {
            const startDate = calculateStudyStarted(u.semester);
            batch.update(doc(firestore, 'users', u.id), { studyStarted: startDate });
            count++;
        }
    });

    if (count === 0) {
        toast({ title: "Intet at beregne", description: "Alle brugere har allerede deres startdatoer." });
        setIsBulkLoading(false);
        return;
    }

    try {
        await batch.commit();
        toast({ title: "Beregning fuldført", description: `${count} brugere fik opdateret deres startdato.` });
    } catch (err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gennemføre bulk opdatering." });
    } finally {
        setIsBulkLoading(false);
    }
  };

  const handleCalculateStartDate = async (userId: string, sem: string) => {
    if (!firestore) return;
    const startDate = calculateStudyStarted(sem);
    try {
        await updateDoc(doc(firestore, 'users', userId), { studyStarted: startDate });
        toast({ title: "Beregnet", description: `Startdato sat til ${startDate}` });
    } catch (err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere startdato." });
    }
  };

  return (
    <>
    <div className="space-y-10 animate-ink pb-20">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 serif">Brugerstyring</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Administrér platformens {stats.total} kolleger og sikr datakvaliteten.</p>
        </div>
        <div className="relative z-10">
          <Button 
            variant="outline" 
            onClick={handleBulkCalculateStartDates}
            disabled={isBulkLoading}
            className="rounded-2xl border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-sm hover:bg-slate-50 transition-all"
          >
            {isBulkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
            Bulk Beregn Startdatoer
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((statCard) => {
          const Icon = statCard.icon;
          return (
            <div key={statCard.key} className={`bg-white p-8 rounded-[2.5rem] border ${statCard.bg} shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 min-h-[160px]`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statCard.color} shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">{statCard.label}</p>
                <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-200" /> : stats[statCard.key as keyof typeof stats]}
                  <span className="text-xs font-bold text-slate-300">pers.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Data Table */}
      <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         
         {/* Filter Bar */}
         <div className="p-8 border-b border-slate-50 bg-slate-50/10 space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
               <div className="relative group w-full xl:max-w-xl">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Søg i brugere, e-mails eller studieretninger..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-sm w-full font-medium shadow-sm"
                  />
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <div className="h-4 w-px bg-slate-200 mx-2"></div>
                      <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-4 cursor-pointer"
                      >
                        <option value="all">Alle Roller</option>
                        <option value="user">Brugere</option>
                        <option value="admin">Admins</option>
                      </select>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <Crown className="w-3.5 h-3.5 text-slate-400" />
                      <div className="h-4 w-px bg-slate-200 mx-2"></div>
                      <select 
                        value={membershipFilter} 
                        onChange={(e) => setMembershipFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-4 cursor-pointer"
                      >
                        <option value="all">Alle Planer</option>
                        <option value="free">Kollega (Gratis)</option>
                        <option value="Kollega+">Kollega+</option>
                        <option value="Kollega+">Kollega++</option>
                        <option value="Semesterpakken">Semesterpakken</option>
                      </select>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <div className="h-4 w-px bg-slate-200 mx-2"></div>
                      <select 
                        value={semesterFilter} 
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-4 cursor-pointer"
                      >
                        <option value="all">Alle Semestre</option>
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <option key={num} value={num.toString()}>{num}. semester</option>
                        ))}
                        <option value="qualified">Færdiguddannet</option>
                      </select>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                      <div className="h-4 w-px bg-indigo-200 mx-2"></div>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-xs font-black text-indigo-900 outline-none pr-4 cursor-pointer uppercase tracking-tighter"
                      >
                        <option value="newest">Nyeste</option>
                        <option value="oldest">Ældste</option>
                        <option value="points_desc">Flest Point</option>
                        <option value="last_active_desc">Senest Aktiv</option>
                      </select>
                  </div>
               </div>
            </div>
         </div>
         
         {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-32 space-y-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-indigo-100" />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-black text-[10px]">COHERO</div>
                </div>
                <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Indlæser database...</p>
            </div>
         ) : error ? (
            <div className="flex-1 flex items-center justify-center text-rose-500 font-bold p-20">Fejl: {error.message}</div>
         ) : paginatedUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-32 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8">
                 <Users className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 serif mb-3">Ingen resultater</h3>
              <p className="text-slate-400 font-medium max-w-sm mb-10 leading-relaxed">Vi fandt ingen kolleger der matcher din søgning. Prøv at justere dine filtre eller søgeord.</p>
              <Button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setMembershipFilter('all'); setSemesterFilter('all'); }} className="rounded-2xl h-12 px-8 bg-slate-900 text-white font-black text-xs uppercase tracking-widest">
                 Ryd Filtre
              </Button>
            </div>
         ) : (
            <div className="overflow-x-auto flex-1 h-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">
                    <th className="px-10 py-6">Kollega & Profil</th>
                    <th className="px-10 py-6">Studie & Status</th>
                    <th className="px-10 py-6">Engagement</th>
                    <th className="px-10 py-6">Sidst Aktiv</th>
                    <th className="px-10 py-6 text-right pr-14">Handlinger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedUsers.map((u, idx) => {
                    const lastActivity = u.lastActivityAt?.toDate() || u.lastLogin?.toDate();
                    const createdAt = u.createdAt?.toDate();
                    const now = new Date();
                    const isOnline = lastActivity ? (now.getTime() - lastActivity.getTime()) < 5 * 60 * 1000 : false;
                    const isAdmin = u.role === 'admin';
                    
                    return (
                    <React.Fragment key={u.id}>
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-slate-50/50 transition-all group cursor-pointer ${expandedUserId === u.id ? 'bg-indigo-50/30' : ''}`} 
                        onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                      >
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-105 duration-500 ${isAdmin ? 'bg-rose-100 text-rose-700' : 'bg-white border border-slate-100 text-slate-600'}`}>
                                 {isAdmin ? <Shield className="w-6 h-6" /> : (u.username?.charAt(0) || u.email?.charAt(0) || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors serif">{u.username}</p>
                                    <SourceBadge source={u.conversionSource} />
                                 </div>
                                 <p className="text-xs text-slate-400 font-medium tracking-tight truncate">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">{u.institution || 'Ikke angivet'}</span>
                                    {u.isQualified ? (
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Færdiguddannet"></div>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">Sem. {u.semester || '?'}</span>
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {u.profession && (
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100/50 uppercase tracking-tighter">
                                            {u.profession}
                                        </span>
                                    )}
                                    {u.isQualified && (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100/50">
                                            Kvalificeret
                                        </span>
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2 mb-2 font-black text-slate-900 italic">
                               <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                               {u.cohéroPoints || 0}
                           </div>
                           <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                u.membership === 'Kollega+' || u.membership === 'Semesterpakken' ? 'bg-amber-950 text-amber-400 border-amber-900/50' : 
                                u.membership === 'Kollega+' ? 'bg-indigo-900 text-indigo-200 border-indigo-800' : 'bg-slate-50 text-slate-500 border-slate-100'
                           }`}>
                             {u.membership || 'Kollega (Gratis)'}
                           </span>
                        </td>
                        <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-slate-200'}`}></div>
                                <div>
                                    <p className="text-[14px] font-bold text-slate-800 leading-none mb-1">
                                        {lastActivity ? new Date(lastActivity).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Aldrig'}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Kl. {lastActivity ? new Date(lastActivity).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                                    </p>
                                </div>
                            </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(u); }} 
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <div className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${expandedUserId === u.id ? 'bg-slate-950 text-white rotate-180 ring-4 ring-slate-100' : 'bg-white border-slate-100 text-slate-300 group-hover:text-slate-600 shadow-sm'}`}>
                                 <ChevronDown className="w-4 h-4" />
                              </div>
                           </div>
                        </td>
                      </motion.tr>

                      <AnimatePresence>
                      {expandedUserId === u.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-slate-100 overflow-hidden">
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-slate-50/40 p-12"
                            >
                                <div className="grid lg:grid-cols-4 gap-12 max-w-7xl">
                                    {/* Kolonne 1: Generelt & Kontakt */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-sm">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Bruger og Kontakt</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Brugernavn / Full Name</span>
                                                <span className="font-bold text-slate-900 serif text-lg">{u.username}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">E-mail Adresse</span>
                                                <span className="font-bold text-slate-700 select-all">{u.email}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Unikt Bruger ID (UID)</span>
                                                <code className="text-[10px] font-mono text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{u.id}</code>
                                            </div>
                                            {u.conversionSource && (
                                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl mt-4">
                                                   <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest block mb-2">Marketing Attribution</span>
                                                   <div className="flex items-center gap-2">
                                                      <SourceBadge source={u.conversionSource} />
                                                      <span className="text-xs font-bold text-white uppercase tracking-tight">{u.conversionSource}</span>
                                                   </div>
                                                   {u.convertedAt && (
                                                      <p className="text-[9px] text-white/40 mt-2 italic">Konverteret {u.convertedAt.toDate().toLocaleString('da-DK')}</p>
                                                   )}
                                                </div>
                                             )}
                                        </div>
                                    </div>

                                    {/* Kolonne 2: Akademisk Status */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
                                                <GraduationCap className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Akademisk Status</h4>
                                        </div>
                                        <div className="space-y-4">
                                             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                                 <div className="flex items-center justify-between">
                                                     <span className="text-xs font-bold text-slate-500">Plan Status</span>
                                                     {u.membership === 'Kollega+' || u.membership === 'Semesterpakken' ? (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-100/50">Active Subscription</span>
                                                     ) : (
                                                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100">Free Tier</span>
                                                     )}
                                                 </div>
                                                 <select 
                                                    value={u.membership || 'Kollega'} 
                                                    onChange={async (e) => {
                                                        const newVal = e.target.value;
                                                        if (!firestore) return;
                                                        try {
                                                            await updateDoc(doc(firestore, 'users', u.id), { 
                                                                membership: newVal,
                                                                // If manually setting to premium, also set the boolean if app uses it
                                                                isPremium: newVal.includes('+') || newVal === 'Semesterpakken'
                                                            });
                                                            toast({ title: "Medlemskab opdateret", description: `${u.username} er nu ${newVal}` });
                                                        } catch (err) {
                                                            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere plan" });
                                                        }
                                                    }}
                                                    className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                 >
                                                    <option value="Kollega">Kollega (Gratis)</option>
                                                    <option value="Kollega+">Kollega+</option>
                                                    <option value="Semesterpakken">Semesterpakken</option>
                                                    <option value="Mentor">Mentor</option>
                                                 </select>
                                                 {u.stripeSubscriptionId && (
                                                     <div className="flex flex-col pt-2 border-t border-slate-50">
                                                         <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Stripe Billing ID</span>
                                                         <code className="text-[9px] font-mono text-indigo-400 bg-indigo-50/30 px-3 py-1.5 rounded-lg border border-indigo-100/50 w-fit select-all cursor-copy" title="Klik for at kopiere">{u.stripeSubscriptionId}</code>
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                 <span className="text-xs font-bold text-slate-500">Semester:</span>
                                                 <span className={`text-xs font-black ${u.isQualified ? 'text-emerald-600' : 'text-slate-900'}`}>{u.semester || (u.isQualified ? 'Afsluttet' : 'N/A')}</span>
                                             </div>
                                             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500">Studie Start:</span>
                                                    <span className="text-xs font-black text-slate-900">{u.studyStarted || 'Ej beregnet'}</span>
                                                </div>
                                                {!u.studyStarted && !u.isQualified && u.semester && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleCalculateStartDate(u.id, u.semester!)}
                                                        className="w-full rounded-xl h-8 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase tracking-widest border border-amber-200/50 shadow-none"
                                                    >
                                                        Kør Beregning
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolonne 3: Finansiel / Bank */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Udbetaling & Sikkerhed</h4>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                            <BankRow label="CPR / CVR" value={u.cprNumber} />
                                            <BankRow label="Bank Reg" value={u.bankReg} />
                                            <BankRow label="Konto Nr." value={u.bankAccount} />
                                            <p className="text-[9px] text-slate-400 leading-relaxed pt-2">Data er krypteret med AES-256 før lagring i databasen.</p>
                                        </div>
                                    </div>

                                    {/* Kolonne 4: Dokumentation & Studiekort */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Studiekort & Validering</h4>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 flex flex-col">
                                            {u.studentCardUrl ? (
                                                <>
                                                    <StudentCardDisplay path={u.studentCardUrl} userId={u.id} userName={u.username || u.email || ''} />
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                                                u.studentCardVerification?.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {u.studentCardVerification?.status === 'verified' ? (
                                                                    <>Verificeret <CheckCircle2 className="w-3 h-3" /></>
                                                                ) : (
                                                                    <>Afvist <XCircle className="w-3 h-3" /></>
                                                                )}
                                                            </span>
                                                            <Button 
                                                                variant="outline" 
                                                                className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const btn = e.currentTarget;
                                                                    btn.disabled = true;
                                                                    try {
                                                                        const res = await scanStudentCardAction({ imageUrl: u.studentCardUrl!, userFullName: u.username || u.email || '' });
                                                                        if (res.success) {
                                                                            const verification: any = { status: res.data.isStudentCard && !res.data.nameMismatch && !res.data.isExpired ? 'verified' : 'rejected', ...res.data };
                                                                            await updateStudentCardVerificationAction(u.id, verification);
                                                                            toast({ title: 'Analyse Fuldført' });
                                                                        }
                                                                    } catch (err) { toast({ variant: 'destructive', title: 'Fejl under scan' }); }
                                                                    finally { btn.disabled = false; }
                                                                }}
                                                            >
                                                                Scan & Analysér
                                                            </Button>
                                                        </div>
                                                        {u.studentCardVerification && (
                                                            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-slate-400 font-bold">Kort Navn:</span>
                                                                    <span className="font-black text-slate-800">{u.studentCardVerification.nameOnCard || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px]">
                                                                    <span className="text-slate-400 font-bold">Udløb:</span>
                                                                    <span className="font-black text-slate-800">{u.studentCardVerification.expiryDate || 'Ukendt'}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-[11px] font-bold text-slate-300 italic uppercase tracking-tighter">Intet dokument fundet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Administrative Actions Row */}
                                <div className="mt-12 flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status på Markedsplads</span>
                                            {u.isMarketplaceBanned ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Udelukket</span>
                                                    <p className="text-xs text-rose-600 font-medium italic">"{u.marketplaceBanReason}"</p>
                                                </div>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">Aktiv <CheckCircle2 className="w-3 h-3" /></span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="rounded-2xl border-slate-200 h-11 px-6 text-xs font-bold"
                                            onClick={async () => {
                                                await clearUserPaymentInfoAction(u.id, u.studentCardUrl);
                                                toast({ title: "Sensitiv data fjernet" });
                                            }}
                                        >
                                            Ryd Finansiel Data
                                        </Button>
                                        
                                        {u.isMarketplaceBanned ? (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 h-11 px-6 text-xs font-bold"
                                                onClick={() => toggleMarketplaceBanAction(u.id, false)}
                                            >
                                                Ophæv Udelukkelse
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 h-11 px-6 text-xs font-bold"
                                                onClick={() => {
                                                    const reason = prompt(`Årsag til udelukkelse af ${u.username}?`);
                                                    if (reason) toggleMarketplaceBanAction(u.id, true, reason);
                                                }}
                                            >
                                                Udeluk fra Markedsplads
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            className="rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest ml-4 shadow-xl shadow-rose-500/10"
                                            onClick={() => handleDeleteClick(u)}
                                        >
                                            Slet permanent
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                      </AnimatePresence>
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
            </div>
         )}
         
         {/* 4. Combined Pagination & Results Info */}
         <div className="p-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/10">
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Resultater</span>
                <p className="text-sm font-bold text-slate-800">
                    Viser {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedUsers.length)}-{Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} af {filteredAndSortedUsers.length}
                </p>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-2xl border-slate-100 h-10 px-4 group" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Forrige
                    </Button>
                    
                    <div className="flex items-center gap-1.5 mx-2">
                        {Array.from({length: totalPages}, (_, i) => i + 1)
                            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                            .map((page, i, arr) => (
                                <React.Fragment key={page}>
                                    {i > 0 && arr[i - 1] !== page - 1 && <span className="text-slate-300 px-1 font-bold">...</span>}
                                    <button 
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === page ? 'bg-slate-950 text-white shadow-xl shadow-slate-900/10 scale-110' : 'text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            ))
                        }
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-2xl border-slate-100 h-10 px-4 group" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Næste <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
         </div>
      </section>
    </div>

    {userToDelete && (
        <DeleteUserModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          username={userToDelete.username}
        />
    )}
    </>
  );
};

export default AdminUsersPage;
