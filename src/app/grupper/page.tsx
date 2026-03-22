'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  Search, 
  UserPlus, 
  LayoutDashboard,
  Folders,
  History,
  Target,
  GraduationCap,
  Briefcase,
  BookOpen,
  Zap,
  ChevronDown,
  X,
  Scale,
  Info,
  Lock,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, setDoc, limit, increment, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';

interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  createdAt: any;
  membersCount: number;
}

const GroupCard = ({ group, idx }: { group: Group, idx: number }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="group"
        >
            <Link href={`/grupper/${group.id}`}>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-900 transition-all flex flex-col justify-between h-72 relative overflow-hidden group-hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                    {/* Abstract Decoration */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-all group-hover:scale-110 pointer-events-none">
                        <Users className="w-32 h-32 -rotate-12 text-slate-900" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col items-end gap-1.5 text-right">
                                <span className="px-3 py-1 bg-amber-50 text-amber-900 text-[10px] font-black uppercase rounded-lg border border-amber-200/50 shadow-sm flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                                    {group.membersCount || 1} Medlemmer
                                </span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                                    SIDEN {group.createdAt?.toDate().toLocaleDateString('da-DK')}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-slate-700 transition-colors mb-2 line-clamp-2 tracking-tight">{group.name}</h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 pr-4">{group.description || 'Ingen beskrivelse tilføjet.'}</p>
                    </div>

                    <div className="relative z-10 pt-6 flex items-center justify-between border-t border-slate-50 group-hover:border-slate-100 transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">Åbn gruppens rum</span>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function GroupsPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const isPremium = useMemo(() => {
    if (!userProfile) return false;
    return ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
  }, [userProfile]);

  const groupsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'groups'), 
        where('memberIds', 'array-contains', user.uid),
        limit(50)
    );
  }, [user, firestore]);

  const { data: userGroups, isLoading: groupsLoading } = useCollection<Group>(groupsQuery);

  const filteredGroups = useMemo(() => {
    if (!userGroups) return [];
    let list = [...userGroups].sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
    
    if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        list = list.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    
    return list;
  }, [userGroups, debouncedSearchQuery]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium) {
        toast({
            variant: "destructive",
            title: "Kun for Kollega+",
            description: "Du skal have et Kollega+ medlemskab for at oprette nye studiegrupper."
        });
        return;
    }
    if (!newGroupName.trim() || isSaving || !user || !firestore) return;

    setIsSaving(true);
    try {
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        creatorId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
        membersCount: 1
      };

      const groupRef = await addDoc(collection(firestore, 'groups'), groupData);
      
      await setDoc(doc(firestore, 'groups', groupRef.id, 'members', user.uid), {
        id: user.uid,
        email: user.email,
        role: 'admin',
        joinedAt: serverTimestamp()
      });

      toast({ title: "Gruppe oprettet!", description: `"${newGroupName}" er nu klar.` });
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupDesc('');
      router.push(`/grupper/${groupRef.id}`);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke oprette gruppe." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || groupsLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden pt-0 transition-colors duration-500">
      
      {/* SIDEBAR NAVIGATION - Premium Slate Look */}
      <aside className="w-80 bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-0 h-screen z-30 shadow-sm shrink-0">
        <div className="p-8 pb-6 flex items-center gap-4 border-b border-slate-50">
            <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-slate-900/10 shrink-0">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Kollega-Rum</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Studiegrupper</p>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all bg-slate-900 text-white shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                <LayoutDashboard className="w-4 h-4" /> Oversigt
            </button>
            <div className="pt-8 pb-3 px-5"><h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Dine Grupper</h3></div>
            {filteredGroups.map(group => (
                <Link key={group.id} href={`/grupper/${group.id}`} className="w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-between group active:scale-[0.98]">
                    <span className="truncate pr-4">{group.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
            ))}
            {filteredGroups.length === 0 && (
                <div className="px-5 py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 mt-2">
                    <p className="text-[11px] text-slate-400 italic font-medium">Ingen grupper endnu.</p>
                </div>
            )}
        </nav>

        <div className="mt-auto p-8 pt-0">
           <div className="p-6 rounded-3xl bg-amber-50/30 border border-amber-100/50 group hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-amber-100 group-hover:rotate-6 transition-transform">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-widest">Studie-Tip</h4>
                </div>
                <p className="text-[11px] text-amber-900/60 font-medium leading-relaxed">Godt samarbejde kræver faste rammer. Brug jeres fælles tidslinje til at styre deadlines.</p>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-visible">
        
        {/* Sub-Header with Search and Actions */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 sm:px-8 md:px-12 flex items-center justify-between sticky top-0 md:top-0 z-40 transition-all shadow-sm">
            <div className="flex items-center gap-4 flex-1 max-w-2xl relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    placeholder="Søg i dine grupper og projekter..."
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 focus:outline-none transition-all text-[15px] font-bold h-14"
                />
            </div>
            
            <div className="flex items-center gap-4 ml-6">
                <TooltipProvider>
                    <Tooltip open={!isPremium ? undefined : false}>
                        <TooltipTrigger asChild>
                            <div className="hidden md:block">
                                <Button 
                                    onClick={() => isPremium ? setIsCreating(true) : router.push('/upgrade')} 
                                    size="lg" 
                                    className={`rounded-[18px] h-14 px-8 shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-[15px] font-black uppercase tracking-widest ${!isPremium ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-none' : 'bg-slate-900'}`}
                                >
                                    {!isPremium ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Opret gruppe
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!isPremium && (
                            <TooltipContent side="bottom" className="bg-slate-900 text-white p-5 max-w-xs border-slate-800 shadow-2xl rounded-2xl">
                                <div className="space-y-3">
                                    <p className="font-black flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest"><Sparkles className="w-4 h-4 fill-amber-400"/> Premium Funktion</p>
                                    <p className="text-[13px] text-slate-300 leading-relaxed font-medium">Kun Kollega+ medlemmer kan oprette nye grupper. Du kan dog stadig inviteres til eksisterende grupper.</p>
                                    <Link href="/upgrade" className="text-xs font-bold text-white underline flex items-center gap-1.5 mt-2 hover:text-amber-400 transition-colors">Start din 7-dages prøve <ArrowUpRight className="w-3.5 h-3.5"/></Link>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                {/* Mobile Create Button */}
                <button 
                  onClick={() => isPremium ? setIsCreating(true) : router.push('/upgrade')}
                  className="md:hidden w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </header>

        <div className="p-5 sm:p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-12 sm:space-y-20">
            {/* HERO / WELCOME SECTION */}
            <header className="space-y-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-200/40">
                    <Users className="w-3 h-3" /> Fællesskab
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">Dine aktive <br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400 italic">kollega-rum.</span></h2>
                        <p className="text-lg text-slate-500 mt-4 font-medium max-w-lg">Oversigt over dine faglige fællesskaber og aktive projekter.</p>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm self-start md:self-auto transition-transform hover:scale-105">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">{filteredGroups.length} Aktive Grupper</span>
                    </div>
                </div>
            </header>

            {/* GROUP GRID */}
            <section className="space-y-8">
                {filteredGroups.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-24 sm:py-32 text-center bg-white rounded-[40px] sm:rounded-[64px] border border-dashed border-slate-200 shadow-sm px-6"
                    >
                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:rotate-6 transition-transform">
                            <Users className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight">Ingen aktive grupper</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-12 leading-relaxed font-medium">Du er endnu ikke medlem af nogen studiegrupper. {isPremium ? 'Opret en selv herunder for at komme i gang.' : 'Du kan blive inviteret af en kollega via din profil-mail.'}</p>
                        {isPremium && (
                            <Button 
                              onClick={() => setIsCreating(true)} 
                              size="lg" 
                              className="rounded-2xl h-16 px-12 bg-slate-900 text-white font-black uppercase tracking-widest text-[15px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                Start din første gruppe
                            </Button>
                        )}
                        {!isPremium && (
                            <Button 
                              onClick={() => router.push('/upgrade')} 
                              variant="outline"
                              size="lg" 
                              className="rounded-2xl h-16 px-12 border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-[15px] active:scale-95 transition-all"
                            >
                                Se upgrade muligheder
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 auto-rows-fr">
                        {/* Premium 'Opret' Card inside grid */}
                        {isPremium && (
                          <motion.div 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="group cursor-pointer"
                              onClick={() => setIsCreating(true)}
                          >
                              <div className="bg-slate-50/50 hover:bg-white p-8 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-slate-900 transition-all flex flex-col items-center justify-center text-center h-72 relative transition-all group-hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50">
                                  <div className="w-16 h-16 bg-white text-slate-900 rounded-[20px] flex items-center justify-center shadow-lg mb-6 group-hover:rotate-12 transition-transform">
                                      <Plus className="w-8 h-8" />
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 tracking-tight">Opret ny gruppe</h3>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px]">Byg dit faglige team</p>
                              </div>
                          </motion.div>
                        )}
                        
                        {filteredGroups.map((group, idx) => (
                            <GroupCard key={group.id} group={group} idx={idx} />
                        ))}
                    </div>
                )}
            </section>
        </div>

        {/* Footer info for mobile */}
        <footer className="mt-auto p-12 text-center lg:hidden bg-slate-50/50 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Cohéro Fællesskab &bull; Din Digitale Kollega</p>
        </footer>
      </main>

      {/* CREATE MODAL - Premium Overhaul */}
      <AnimatePresence>
        {isCreating && isPremium && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={() => setIsCreating(false)}
            />
            <motion.form 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                onSubmit={handleCreateGroup} 
                className="relative bg-[#FDFBF7] w-full max-w-lg rounded-[48px] shadow-2xl p-8 sm:p-12 space-y-8 border border-white"
            >
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-white shadow-2xl shadow-slate-900/20">
                    <PlusCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ny Studiegruppe</h2>
                <p className="text-sm text-slate-500 font-medium">Giv jeres gruppe et navn og en beskrivelse.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Gruppens navn</label>
                    <Input 
                        placeholder="F.eks. Modul 4 - Casesparring" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        className="h-16 rounded-2xl bg-white border-slate-100 shadow-inner focus:ring-8 focus:ring-slate-900/5 focus:border-slate-300 text-[16px] font-bold px-6"
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Beskrivelse (valgfri)</label>
                    <Textarea 
                        placeholder="Hvad er jeres fælles faglige mål?" 
                        value={newGroupDesc} 
                        onChange={e => setNewGroupDesc(e.target.value)} 
                        className="rounded-[24px] min-h-[140px] bg-white border-slate-100 shadow-inner focus:ring-8 focus:ring-slate-900/5 focus:border-slate-300 text-[15px] font-medium p-6"
                    />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="h-16 rounded-[20px] font-bold text-slate-400 order-2 sm:order-1">Annuller</Button>
                <Button type="submit" disabled={isSaving} className="flex-grow h-16 rounded-[20px] bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 order-1 sm:order-2">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : 'Opret gruppe'}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
