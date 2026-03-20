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
  ArrowUpRight
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
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="group"
        >
            <Link href={`/grupper/${group.id}`}>
                <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-amber-950 transition-all flex flex-col justify-between h-72 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform group-hover:opacity-[0.08]">
                        <Users className="w-32 h-32 -rotate-12 text-amber-900" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="px-3 py-1 bg-amber-50 text-amber-900 text-[9px] font-black uppercase rounded-lg border border-amber-100 shadow-sm">
                                    {group.membersCount || 1} Medlemmer
                                </span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">
                                    Oprettet {group.createdAt?.toDate().toLocaleDateString('da-DK')}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-amber-950 serif leading-tight group-hover:text-amber-700 transition-colors mb-2 line-clamp-2">{group.name}</h3>
                        <p className="text-sm text-slate-400 italic line-clamp-2 pr-4">{group.description || 'Ingen beskrivelse tilføjet.'}</p>
                    </div>

                    <div className="relative z-10 pt-6 flex items-center justify-between border-t border-amber-50">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300 group-hover:text-amber-950 transition-colors">Åbn gruppens rum</span>
                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 group-hover:text-amber-950 transition-all" />
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
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-white border-r border-amber-100 hidden lg:flex flex-col sticky top-0 h-screen z-30 shadow-sm shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-amber-50">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg shrink-0">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Kollega-Rum</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Studiegrupper</p>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-amber-950 text-white shadow-xl">
                <LayoutDashboard className="w-4 h-4" /> Oversigt
            </button>
            <div className="pt-8 pb-4 px-4"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dine Grupper</h3></div>
            {filteredGroups.map(group => (
                <Link key={group.id} href={`/grupper/${group.id}`} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-950 transition-all flex items-center justify-between group">
                    <span className="truncate">{group.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
            ))}
            {filteredGroups.length === 0 && <p className="px-4 py-4 text-[10px] text-slate-400 italic">Ingen grupper endnu.</p>}
        </nav>

        <div className="mt-auto p-6 border-t border-amber-50 bg-amber-50/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Info className="w-5 h-5 text-amber-700" /></div>
                <h4 className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Kollegialt Tips</h4>
            </div>
            <p className="text-xs text-slate-500 italic leading-relaxed">Godt samarbejde kræver faste rammer. Brug jeres fælles tidslinje til at styre deadlines.</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative custom-scrollbar">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-amber-100 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-6 flex-1 max-w-2xl relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Søg i dine grupper og projekter..."
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all shadow-inner text-sm font-bold h-12"
                />
            </div>
            
            <div className="flex items-center gap-4 ml-8">
                <TooltipProvider>
                    <Tooltip open={!isPremium ? undefined : false}>
                        <TooltipTrigger asChild>
                            <div className="w-full md:w-auto">
                                <Button 
                                    onClick={() => isPremium ? setIsCreating(true) : router.push('/upgrade')} 
                                    size="lg" 
                                    className={`rounded-2xl h-12 px-8 shadow-xl shadow-amber-950/10 active:scale-95 transition-all ${!isPremium ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-none' : ''}`}
                                >
                                    {!isPremium ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Opret ny gruppe
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!isPremium && (
                            <TooltipContent className="bg-amber-950 text-white p-4 max-w-xs border-amber-800 shadow-2xl">
                                <div className="space-y-2">
                                    <p className="font-bold flex items-center gap-2 text-amber-400"><Sparkles className="w-4 h-4"/> Premium Funktion</p>
                                    <p className="text-xs text-amber-100/70 leading-relaxed">Kun Kollega+ medlemmer kan oprette nye grupper. Du kan dog stadig inviteres til eksisterende grupper.</p>
                                    <Link href="/upgrade" className="text-xs font-bold text-white underline flex items-center gap-1 mt-2">Opgrader her <ArrowUpRight className="w-3 h-3"/></Link>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>

        <div className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-20">
            {/* GROUP LIST */}
            <section className="space-y-10">
                <div className="flex items-center justify-between border-b border-amber-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-amber-950 serif tracking-tight">Dine aktive grupper</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium italic">Oversigt over dine faglige fællesskaber.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900/40 uppercase tracking-widest">
                        <Users className="w-4 h-4" /> {filteredGroups.length} Grupper
                    </div>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[4rem] border border-dashed border-amber-200 shadow-inner animate-ink">
                        <Users className="w-16 h-16 text-amber-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-amber-950 serif mb-4">Ingen aktive grupper</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">Du er endnu ikke medlem af nogen studiegrupper. {isPremium ? 'Opret en selv herunder.' : 'Du kan blive inviteret af en kollega via din mail.'}</p>
                        {isPremium && <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-2xl h-14 px-10">Start din første gruppe</Button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGroups.map((group, idx) => (
                            <GroupCard key={group.id} group={group} idx={idx} />
                        ))}
                    </div>
                )}
            </section>
        </div>
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreating && isPremium && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" 
                onClick={() => setIsCreating(false)}
            />
            <motion.form 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onSubmit={handleCreateGroup} 
                className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border border-amber-100"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
                    <UserPlus className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-amber-950 serif">Ny Studiegruppe</h2>
                <p className="text-sm text-slate-500 italic">Giv jeres gruppe et navn og en kort beskrivelse.</p>
              </div>
              <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Gruppens navn</label>
                    <Input 
                        placeholder="F.eks. Modul 4 - Nørrebro-holdet" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                        required 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Beskrivelse (valgfri)</label>
                    <Textarea 
                        placeholder="Hvad er jeres faglige fokus?" 
                        value={newGroupDesc} 
                        onChange={e => setNewGroupDesc(e.target.value)} 
                        className="rounded-2xl min-h-[120px] shadow-inner focus:ring-4 focus:ring-amber-950/5"
                    />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="flex-1 rounded-xl h-14">Annuller</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
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
