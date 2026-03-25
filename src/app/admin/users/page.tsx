
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { 
  Loader2, Search, Trash2, ChevronDown, Briefcase, User, Shield, Zap,
  Users, TrendingUp, Activity, Crown, Filter, ArrowUpDown, Calendar, ChevronLeft, ChevronRight, CreditCard, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import DeleteUserModal from '@/components/DeleteUserModal';
import { useDebounce } from 'use-debounce';
import { decryptData } from '@/lib/encryption';
import { scanStudentCardAction, updateStudentCardVerificationAction, toggleMarketplaceBanAction } from '@/app/actions';
import { StudentCardVerification } from '@/ai/flows/types';

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
}

const STAT_CARDS = [
  { label: 'Totale Brugere', key: 'total', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Nye (30 dage)', key: 'new', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Aktive (24t)', key: 'active', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Plus Medlemmer', key: 'premium', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
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
        <div className="aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden relative group">
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
            ) : url ? (
                <>
                    <img src={url} alt="Studiekort" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <a href={url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">Vis fuld størrelse</a>
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
    let premiumCount = 0;

    nonAdmins.forEach(u => {
      const createdAt = u.createdAt?.toDate();
      const lastActivity = u.lastActivityAt?.toDate() || u.lastLogin?.toDate();
      const mem = u.membership || '';

      if (createdAt && createdAt > thirtyDaysAgo) newCount++;
      if (lastActivity && lastActivity > twentyFourHoursAgo) activeCount++;
      if (mem.includes('+')) premiumCount++;
    });

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
  }, [users, debouncedSearchTerm, roleFilter, membershipFilter, sortBy]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter, membershipFilter, sortBy]);

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
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      toast({
        title: 'Bruger slettet',
        description: `Brugeren ${userToDelete.username} er blevet slettet fra databasen.`,
      });
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Kunne ikke slette brugeren.',
      });
    }
  };

  return (
    <>
    <div className="space-y-8 animate-ink">
      {/* Header sections */}
      <div>
        <h3 className="text-3xl font-bold text-slate-900 serif">Brugeradministration</h3>
        <p className="text-sm text-slate-500 mt-1 font-medium italic">Få indsigt i brugeraktivitet og håndtér profiler på platformen.</p>
      </div>

      {/* Stats Overview */}
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
                  {isLoading ? <span className="text-slate-200">...</span> : stats[statCard.key as keyof typeof stats]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         
         <div className="p-8 border-b border-slate-50 bg-slate-50/20 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
               {/* Search */}
               <div className="relative group w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Søg i brugernavne eller e-mails..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm w-full font-medium shadow-sm"
                  />
               </div>
               
               {/* Filters */}
               <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select 
                      value={roleFilter} 
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none hover:border-slate-300 transition-all shadow-sm focus:ring-4 focus:ring-slate-100 outline-none"
                    >
                      <option value="all">Alle Roller</option>
                      <option value="user">Brugere</option>
                      <option value="admin">Admins</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <Crown className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select 
                      value={membershipFilter} 
                      onChange={(e) => setMembershipFilter(e.target.value)}
                      className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none hover:border-slate-300 transition-all shadow-sm focus:ring-4 focus:ring-slate-100 outline-none"
                    >
                      <option value="all">Alle Planer</option>
                      <option value="free">Kollega (Gratis)</option>
                      <option value="Kollega+">Kollega+</option>
                      <option value="Kollega++">Kollega++</option>
                      <option value="Semesterpakken">Semesterpakken</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-10 pr-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none hover:border-slate-300 transition-all shadow-sm focus:ring-4 focus:ring-slate-100 outline-none"
                    >
                      <option value="newest">Nyeste Først</option>
                      <option value="oldest">Ældste Først</option>
                      <option value="points_desc">Flest Point</option>
                      <option value="last_active_desc">Senest Aktiv</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
               </div>
            </div>
         </div>
         
         {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200 mb-4" /> <p className="text-slate-400 font-bold">Indlæser brugere...</p></div>
         ) : error ? (
            <div className="flex-1 flex items-center justify-center text-rose-500 font-bold">Fejl i indlæsning: {error.message}</div>
         ) : paginatedUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                 <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ingen brugere fundet</h3>
              <p className="text-slate-400 text-sm max-w-sm">Der er ingen brugere, der matcher dine aktuelle søge- eller filterkriterier.</p>
              <Button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setMembershipFilter('all'); }} variant="outline" className="mt-6 rounded-2xl">
                 Ryd Filtre
              </Button>
            </div>
         ) : (
            <div className="overflow-x-auto flex-1 h-full">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Kollega</th>
                    <th className="px-8 py-5">Status & Info</th>
                    <th className="px-8 py-5">Engagement</th>
                    <th className="px-8 py-5">Aktivitet & Historik</th>
                    <th className="px-8 py-5 text-right pr-12">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => {
                    const lastActivity = u.lastActivityAt?.toDate() || u.lastLogin?.toDate();
                    const createdAt = u.createdAt?.toDate();
                    const now = new Date();
                    const isOnline = lastActivity ? (now.getTime() - lastActivity.getTime()) < 5 * 60 * 1000 : false;
                    const isAdmin = u.role === 'admin';
                    
                    return (
                    <React.Fragment key={u.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors group cursor-pointer ${expandedUserId === u.id ? 'bg-slate-50/50' : ''}`} onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner shrink-0 ${isAdmin ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-600'}`}>
                                 {isAdmin ? <Shield className="w-5 h-5" /> : (u.username?.charAt(0) || '?').toUpperCase()}
                              </div>
                              <div className="truncate min-w-0">
                                 <p className="font-bold text-slate-900 leading-none mb-1.5 truncate">{u.username}</p>
                                 <p className="text-xs text-slate-500 font-medium truncate">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-sm font-bold text-slate-800">{u.institution || 'Ej angivet'}</p>
                           <p className="text-xs text-slate-400 capitalize font-medium">{u.semester || 'Manglende info'}</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                               <span className="text-sm font-black text-slate-800">{u.cohéroPoints || 0}</span>
                           </div>
                           <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${u.membership === 'Kollega++' || u.membership === 'Semesterpakken' ? 'bg-amber-100 text-amber-900' : u.membership === 'Kollega+' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'}`}>
                             {u.membership || 'Kollega'}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className="text-xs font-bold text-slate-600">
                                  {lastActivity ? new Date(lastActivity).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Aldrig'}
                                </span>
                             </div>
                             <div className="flex items-center gap-2 text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  Oprettet {createdAt ? new Date(createdAt).toLocaleDateString('da-DK') : 'Ukendt'}
                                </span>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(u); }} className="p-2.5 bg-white shadow-sm border border-slate-200 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all hover:border-rose-100">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <div className={`p-2.5 rounded-xl border transition-all ${expandedUserId === u.id ? 'bg-slate-900 border-slate-900 text-white rotate-180' : 'bg-white border-slate-200 text-slate-400'}`}>
                                 <ChevronDown className="w-4 h-4" />
                              </div>
                           </div>
                        </td>
                      </tr>
                      {expandedUserId === u.id && (
                        <tr>
                          <td colSpan={5} className="p-0 bg-slate-50 border-b border-slate-200">
                            <div className="p-8 grid lg:grid-cols-4 gap-8">
                               <div className="space-y-4">
                                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Generelt</h4>
                                  <div className="text-sm space-y-2">
                                    <p className="flex justify-between border-b border-white pb-2"><span className="text-slate-500 font-medium">Username:</span> <span className="font-bold text-slate-900">{u.username}</span></p>
                                    <p className="flex justify-between border-b border-white pb-2"><span className="text-slate-500 font-medium">Email:</span> <span className="font-bold text-slate-900">{u.email}</span></p>
                                    <p className="flex justify-between pb-2"><span className="text-slate-500 font-medium">UID:</span> <span className="text-xs font-mono text-slate-400 bg-white px-2 py-0.5 rounded">{u.id}</span></p>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Adgang</h4>
                                  <div className="text-sm space-y-2">
                                    <p className="flex justify-between border-b border-white pb-2"><span className="text-slate-500 font-medium">Rolle:</span> <span className="font-bold text-slate-900 capitalize">{u.role || 'Bruger'}</span></p>
                                    <p className="flex justify-between border-b border-white pb-2"><span className="text-slate-500 font-medium">Plan:</span> <span className="font-bold text-slate-900">{u.membership || 'Kollega (Gratis)'}</span></p>
                                    <p className="flex justify-between pb-2"><span className="text-slate-500 font-medium">Startdato:</span> <span className="font-bold text-slate-900">{createdAt ? new Date(createdAt).toLocaleDateString('da-DK') : '-'}</span></p>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Udbetaling</h4>
                                   <div className="text-sm space-y-2">
                                     <BankRow label="CPR / CVR" value={u.cprNumber} />
                                     <BankRow label="Reg" value={u.bankReg} />
                                     <BankRow label="Konto" value={u.bankAccount} />
                                   </div>
                                </div>
                                <div className="space-y-4 lg:col-span-2 xl:col-span-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Studiekort</h4>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                        {u.studentCardUrl ? (
                                            <div className="space-y-4">
                                                <StudentCardDisplay path={u.studentCardUrl} userId={u.id} userName={u.username || u.email || ''} />
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            u.studentCardVerification?.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 
                                                            u.studentCardVerification?.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {u.studentCardVerification?.status === 'verified' ? 'Verificeret' : 
                                                             u.studentCardVerification?.status === 'rejected' ? 'Afvist' : 'Afventer' }
                                                        </span>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-2"
                                                            disabled={!u.studentCardUrl}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const btn = e.currentTarget;
                                                                btn.disabled = true;
                                                                const originalText = btn.innerText;
                                                                btn.innerText = "Scanner...";
                                                                
                                                                try {
                                                                    const res = await scanStudentCardAction({ imageUrl: u.studentCardUrl!, userFullName: u.username || u.email || '' });
                                                                    
                                                                    if (!res.success) {
                                                                        throw new Error(res.error || 'Ukendt fejl under scanning');
                                                                    }

                                                                    const verification: any = {
                                                                        status: res.data.isStudentCard && !res.data.nameMismatch && !res.data.isExpired ? 'verified' : 'rejected',
                                                                        ...res.data
                                                                    };
                                                                    await updateStudentCardVerificationAction(u.id, verification);
                                                                    toast({ title: 'Scanning fuldført', description: 'Studiekortet er blevet analyseret.' });
                                                                } catch (err) {
                                                                    toast({ title: 'Scanning fejlede', variant: 'destructive', description: err instanceof Error ? err.message : 'Ukendt fejl' });
                                                                } finally {
                                                                    btn.disabled = false;
                                                                    btn.innerText = originalText;
                                                                }
                                                            }}
                                                        >
                                                            Scan Nu
                                                        </Button>
                                                    </div>
                                                    
                                                    {u.studentCardVerification && (
                                                        <div className="space-y-2 text-[10px] border-t border-slate-50 pt-3">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tight">Navn på kort</span>
                                                                <span className={`font-black text-right ${u.studentCardVerification.nameMismatch ? 'text-rose-600' : 'text-slate-800'}`}>
                                                                    {u.studentCardVerification.nameOnCard || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold uppercase tracking-tight">Udløb</span>
                                                                <span className={`font-black text-right ${u.studentCardVerification.isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                                                    {u.studentCardVerification.expiryDate || 'Ukendt'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-slate-400 italic text-[10px]">Intet studiekort uploadet.</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm lg:col-span-2 xl:col-span-1">
                                   <div>
                                     <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-2 mb-4"><Shield className="w-3.5 h-3.5" /> Administrative Handlinger</h4>
                                     <p className="text-xs text-slate-500 leading-relaxed mb-4">Advarsel: Sletning af en bruger er permanent. De mister alt indhold og deres abonnement annulleres, hvis det er aktivt.</p>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <Button size="sm" variant="outline" className="rounded-xl border-slate-200" disabled>Nulstil Adgangskode (Kommer snart)</Button>
                                      {u.isMarketplaceBanned ? (
                                          <Button size="sm" variant="outline" className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={async () => {
                                              if (confirm(`Vil du fjerne udelukkelsen for ${u.username || u.email}?`)) {
                                                  await toggleMarketplaceBanAction(u.id, false);
                                                  toast({ title: "Udelukkelse fjernet", description: "Brugeren har nu adgang til markedspladsen igen." });
                                              }
                                          }}>Fjern Udelukkelse</Button>
                                      ) : (
                                          <Button size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50" onClick={async () => {
                                              const reason = prompt(`Hvorfor skal ${u.username || u.email} udelukkes fra markedspladsen?`);
                                              if (reason) {
                                                  await toggleMarketplaceBanAction(u.id, true, reason);
                                                  toast({ title: "Bruger udelukket", description: "Brugeren er nu spærret fra markedspladsen." });
                                              }
                                          }}>Udeluk fra Markedsplads</Button>
                                      )}
                                      <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => handleDeleteClick(u)}>Slet Bruger permanent</Button>
                                   </div>
                                   {u.isMarketplaceBanned && (
                                       <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
                                           <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                                           <div>
                                               <p className="text-[10px] font-black uppercase text-rose-900 mb-1">Udelukket fra markedsplads</p>
                                               <p className="text-[11px] font-medium text-rose-700 leading-relaxed italic">Begrundelse: {u.marketplaceBanReason}</p>
                                           </div>
                                       </div>
                                   )}
                                </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
           </div>
         )}
         
         {/* Pagination Controls */}
         {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-sm">
              <span className="text-slate-500 font-medium pl-4">Viser {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedUsers.length)} til {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} af {filteredAndSortedUsers.length} brugere</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Forrige
                </Button>
                <div className="flex items-center gap-1.5 px-3">
                   {Array.from({length: totalPages}, (_, i) => i + 1)
                     .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                     .map((page, i, arr) => (
                       <React.Fragment key={page}>
                         {i > 0 && arr[i - 1] !== page - 1 && <span className="text-slate-300">...</span>}
                         <button 
                           onClick={() => setCurrentPage(page)}
                           className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
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
                  className="rounded-xl" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Næste <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
         )}
      </div>

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
