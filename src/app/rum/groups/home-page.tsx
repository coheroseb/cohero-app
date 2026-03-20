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
  LogOut,
  Globe
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
  finalDeadline?: string;
  createdAt: any;
  membersCount: number;
}

const GroupCard = ({ group, idx, locale }: { group: Group, idx: number, locale: 'da' | 'en' }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="group"
        >
            <Link href={`/rum/groups/view/${group.id}?lang=${locale}`}>
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
                                    {group.membersCount || 1} {locale === 'da' ? 'Medlemmer' : 'Members'}
                                </span>
                                {group.finalDeadline ? (
                                    <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter italic flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        {locale === 'da' ? 'Deadline' : 'Deadline'} {new Date(group.finalDeadline).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">
                                        {locale === 'da' ? 'Oprettet' : 'Created'} {group.createdAt?.toDate().toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-amber-950 serif leading-tight group-hover:text-amber-700 transition-colors mb-2 line-clamp-2">{group.name}</h3>
                        <p className="text-sm text-slate-400 italic line-clamp-2 pr-4">{group.description || (locale === 'da' ? 'Ingen beskrivelse tilføjet.' : 'No description added.')}</p>
                    </div>

                    <div className="relative z-10 pt-6 flex items-center justify-between border-t border-amber-50">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300 group-hover:text-amber-950 transition-colors">
                            {locale === 'da' ? 'Åbn gruppens rum' : 'Open workspace'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 group-hover:text-amber-950 transition-all" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default function GroupsPage() {
  const { user, userProfile, isUserLoading, handleLogout } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [locale, setLocale] = useState<'da' | 'en'>('da');
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    const queryLang = new URLSearchParams(window.location.search).get('lang') as 'da' | 'en';
    const savedLocale = localStorage.getItem('cohero_groups_locale') as 'da' | 'en';
    if (queryLang && (queryLang === 'da' || queryLang === 'en')) {
      setLocale(queryLang);
    } else if (savedLocale && (savedLocale === 'da' || savedLocale === 'en')) {
      setLocale(savedLocale);
    }
  }, []);

  const handleLocaleChange = (newLocale: 'da' | 'en') => {
    setLocale(newLocale);
    localStorage.setItem('cohero_groups_locale', newLocale);
  };

  const t = {
      da: {
          title: "Cohéro Project Group",
          subtitle: "Studiegrupper",
          overview: "Oversigt",
          yourGroups: "Dine Grupper",
          noGroupsMenu: "Ingen grupper endnu.",
          tipsTitle: "Kollegialt Tips",
          tipsText: "Good collaboration requires clear boundaries. Use your shared timeline to manage deadlines.",
          logout: "Log ud af Cohéro",
          searchPlaceholder: "Søg i dine grupper og projekter...",
          createGroup: "Opret ny gruppe",
          premiumRequired: "Opgradering påkrævet",
          premiumDesc: "Du skal have et Group Pro eller Kollega+ medlemskab for at oprette nye studiegrupper.",
          premiumTooltipTitle: "Adgang påkrævet",
          premiumTooltipDesc: "Kun Group Pro eller Kollega+ medlemmer kan oprette nye grupper. Du kan dog stadig inviteres til eksisterende grupper.",
          premiumTooltipLink: "Se medlemskaber her",
          activeGroups: "Dine aktive grupper",
          activeGroupsDesc: "Oversigt over dine faglige fællesskaber.",
          groupsCount: "Grupper",
          noActiveGroupsTitle: "Ingen aktive grupper",
          noActiveGroupsDescPremium: "Du er endnu ikke medlem af nogen studiegrupper. Opret en selv herunder.",
          noActiveGroupsDescFree: "Du er endnu ikke medlem af nogen studiegrupper. Du kan blive inviteret af en kollega via din mail.",
          startFirstGroup: "Start din første gruppe",
          newGroupTitle: "Ny Studiegruppe",
          newGroupSubtitle: "Giv jeres gruppe et navn og en kort beskrivelse.",
          groupNameLabel: "Gruppens navn",
          groupNamePlaceholder: "F.eks. Modul 4 - Nørrebro-holdet",
          groupDescLabel: "Beskrivelse (valgfri)",
          groupDescPlaceholder: "Hvad er jeres faglige fokus?",
          cancel: "Annuller",
          createAction: "Opret gruppe",
          creating: "Opretter...",
          inviteColleague: "Inviter kollega",
          inviteDesc: "Tilføj et nyt medlem til en af dine grupper.",
          successTitle: "Gruppe oprettet!",
          errorTitle: "Fejl",
          errorDesc: "Kunne ikke oprette gruppe.",
      },
      en: {
          title: "Cohéro Project Group",
          subtitle: "Study Groups",
          overview: "Overview",
          yourGroups: "Your Groups",
          noGroupsMenu: "No groups yet.",
          tipsTitle: "Colleague Tip",
          tipsText: "Good collaboration requires clear boundaries. Use your shared timeline to manage deadlines.",
          logout: "Log out of Cohéro",
          searchPlaceholder: "Search your groups and projects...",
          createGroup: "Create new group",
          premiumRequired: "Upgrade required",
          premiumDesc: "You need a Group Pro or Kollega+ membership to create new study groups.",
          premiumTooltipTitle: "Access required",
          premiumTooltipDesc: "Only Group Pro or Kollega+ members can create new groups. You can still be invited to existing groups, however.",
          premiumTooltipLink: "View memberships here",
          activeGroups: "Your active groups",
          activeGroupsDesc: "Overview of your professional communities.",
          groupsCount: "Groups",
          noActiveGroupsTitle: "No active groups",
          noActiveGroupsDescPremium: "You are not a member of any study groups yet. Create one yourself below.",
          noActiveGroupsDescFree: "You are not a member of any study groups yet. You can be invited by a colleague via your email.",
          startFirstGroup: "Start your first group",
          newGroupTitle: "New Study Group",
          newGroupSubtitle: "Give your group a name and a short description.",
          groupNameLabel: "Group name",
          groupNamePlaceholder: "E.g. Module 4 - Project Alpha",
          inviteColleague: "Invite colleague",
          inviteDesc: "Add a new member to one of your groups.",
          groupDescLabel: "Description (optional)",
          groupDescPlaceholder: "What is your academic focus?",
          cancel: "Cancel",
          createAction: "Create group",
          creating: "Creating...",
          successTitle: "Group created!",
          errorTitle: "Error",
          errorDesc: "Could not create group.",
      }
  };

  const currentT = t[locale];

  const hasAccess = useMemo(() => {
    if (!userProfile) return false;
    const membership = userProfile.membership || '';
    return ['Kollega+', 'Semesterpakken', 'Kollega++', 'Group Pro'].includes(membership);
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
    let list = [...userGroups].sort((a, b) => {
        const dateA = a.finalDeadline ? new Date(a.finalDeadline).getTime() : a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.finalDeadline ? new Date(b.finalDeadline).getTime() : b.createdAt?.toDate()?.getTime() || 0;
        return dateA - dateB;
    });

    if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        list = list.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    
    return list;
  }, [userGroups, debouncedSearchQuery]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) {
        toast({
            variant: "destructive",
            title: currentT.premiumRequired,
            description: currentT.premiumDesc
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

      toast({ title: currentT.successTitle, description: `"${newGroupName}" er nu klar.` });
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupDesc('');
      router.push(`/rum/groups/view/${groupRef.id}?lang=${locale}`);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: currentT.errorTitle, description: currentT.errorDesc });
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
                <h1 className="text-xl font-bold text-amber-950 serif tracking-tight leading-tight">{currentT.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">{currentT.subtitle}</p>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-amber-950 text-white shadow-xl">
                <LayoutDashboard className="w-4 h-4" /> {currentT.overview}
            </button>
            <div className="pt-8 pb-4 px-4"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{currentT.yourGroups}</h3></div>
            {filteredGroups.map(group => (
                <Link key={group.id} href={`/rum/groups/view/${group.id}?lang=${locale}`} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-950 transition-all flex items-center justify-between group">
                    <span className="truncate">{group.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
            ))}
            {filteredGroups.length === 0 && <p className="px-4 py-4 text-[10px] text-slate-400 italic">{currentT.noGroupsMenu}</p>}
        </nav>

        <div className="mt-auto border-t border-amber-50 bg-amber-50/20">
            <div className="p-4 border-b border-amber-50 flex items-center gap-2">
                 <button 
                    onClick={() => handleLocaleChange('da')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${locale === 'da' ? 'bg-white shadow-sm text-amber-950 border border-amber-100' : 'text-slate-400 hover:text-amber-900'}`}
                >
                    Dansk
                </button>
                <button 
                    onClick={() => handleLocaleChange('en')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${locale === 'en' ? 'bg-white shadow-sm text-amber-950 border border-amber-100' : 'text-slate-400 hover:text-amber-900'}`}
                >
                    English
                </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full p-6 flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors font-black uppercase text-[10px] tracking-widest"
            >
              <LogOut className="w-4 h-4" /> {currentT.logout}
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative custom-scrollbar">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-amber-100 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-6 flex-1 max-w-2xl relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                <input 
                    type="text" 
                    placeholder={currentT.searchPlaceholder}
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all shadow-inner text-sm font-bold h-12"
                />
            </div>
            
            <div className="flex items-center gap-4 ml-8">
                <TooltipProvider>
                    <Tooltip open={!hasAccess ? undefined : false}>
                        <TooltipTrigger asChild>
                            <div className="w-full md:w-auto">
                                <Button 
                                    onClick={() => hasAccess ? setIsCreating(true) : router.push(`/upgrade?source=groups&lang=${locale}`)} 
                                    size="lg" 
                                    className={`rounded-2xl h-12 px-8 shadow-xl shadow-amber-950/10 active:scale-95 transition-all ${!hasAccess ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-none' : ''}`}
                                >
                                    {!hasAccess ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {currentT.createGroup}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!hasAccess && (
                            <TooltipContent className="bg-amber-950 text-white p-4 max-w-xs border-amber-800 shadow-2xl">
                                <div className="space-y-2">
                                    <p className="font-bold flex items-center gap-2 text-amber-400"><Sparkles className="w-4 h-4"/> {currentT.premiumTooltipTitle}</p>
                                    <p className="text-xs text-amber-100/70 leading-relaxed">{currentT.premiumTooltipDesc}</p>
                                    <Link href={`/upgrade?source=groups&lang=${locale}`} className="text-xs font-bold text-white underline flex items-center gap-1 mt-2">{currentT.premiumTooltipLink} <ArrowUpRight className="w-3 h-3"/></Link>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                <div className="lg:hidden flex items-center gap-2">
                    <button onClick={() => handleLocaleChange(locale === 'da' ? 'en' : 'da')} className="p-3 bg-white border border-amber-100 rounded-xl text-amber-950 font-bold text-xs uppercase">
                        {locale}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="p-3 bg-white border border-amber-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>

        <div className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-20">
            {/* GROUP LIST */}
            <section className="space-y-10">
                <div className="flex items-center justify-between border-b border-amber-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-amber-950 serif tracking-tight">{currentT.activeGroups}</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium italic">{currentT.activeGroupsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-amber-900/40 uppercase tracking-widest">
                        <Users className="w-4 h-4" /> {filteredGroups.length} {currentT.groupsCount}
                    </div>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[4rem] border border-dashed border-amber-200 shadow-inner animate-ink">
                        <Users className="w-16 h-16 text-amber-100 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-amber-950 serif mb-4">{currentT.noActiveGroupsTitle}</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">{hasAccess ? currentT.noActiveGroupsDescPremium : currentT.noActiveGroupsDescFree}</p>
                        {hasAccess && <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-2xl h-14 px-10">{currentT.startFirstGroup}</Button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* New Group Card inside grid */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0 }}
                            className="group cursor-pointer"
                            onClick={() => hasAccess ? setIsCreating(true) : router.push(`/upgrade?source=groups&lang=${locale}`)}
                        >
                            <div className="bg-amber-50/50 hover:bg-amber-50 p-8 rounded-[2.5rem] border-2 border-dashed border-amber-200 hover:border-amber-950 transition-all flex flex-col items-center justify-center text-center h-72 relative overflow-hidden">
                                <div className="w-16 h-16 bg-white text-amber-950 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    {hasAccess ? <Plus className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                                </div>
                                <h3 className="text-xl font-bold text-amber-950 serif leading-tight mb-2">{currentT.createGroup}</h3>
                                <p className="text-xs text-slate-500 italic max-w-[200px]">{hasAccess ? currentT.newGroupSubtitle : currentT.premiumRequired}</p>
                            </div>
                        </motion.div>
                        {filteredGroups.map((group, idx) => (
                            <GroupCard key={group.id} group={group} idx={idx + 1} locale={locale} />
                        ))}
                    </div>
                )}
            </section>
        </div>
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreating && hasAccess && (
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
                <h2 className="text-2xl font-bold text-amber-950 serif">{currentT.newGroupTitle}</h2>
                <p className="text-sm text-slate-500 italic">{currentT.newGroupSubtitle}</p>
              </div>
              <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.groupNameLabel}</label>
                    <Input 
                        placeholder={currentT.groupNamePlaceholder}
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        className="h-14 rounded-xl shadow-inner focus:ring-4 focus:ring-amber-950/5"
                        required 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.groupDescLabel}</label>
                    <Textarea 
                        placeholder={currentT.groupDescPlaceholder}
                        value={newGroupDesc} 
                        onChange={e => setNewGroupDesc(e.target.value)} 
                        className="rounded-2xl min-h-[120px] shadow-inner focus:ring-4 focus:ring-amber-950/5"
                    />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="flex-1 rounded-xl h-14">{currentT.cancel}</Button>
                <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl h-14 shadow-xl shadow-amber-950/10">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : currentT.createAction}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
