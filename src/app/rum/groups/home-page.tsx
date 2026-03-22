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
  Globe,
  Settings,
  PlusCircle,
  Bell,
  Menu,
  QrCode,
  Camera,
  UserCheck
} from 'lucide-react';
import QRScanner from '@/components/QRScanner';
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
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="group"
        >
            <Link href={`/rum/groups/view/${group.id}?lang=${locale}`}>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-900 transition-all flex flex-col justify-between h-72 relative overflow-hidden group-hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-all group-hover:scale-110 pointer-events-none">
                        <Users className="w-32 h-32 -rotate-12 text-slate-900" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col items-end gap-1.5 text-right">
                                <span className="px-3 py-1 bg-slate-100 text-slate-900 text-[10px] font-black uppercase rounded-lg border border-slate-200/50 shadow-sm flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></div>
                                    {group.membersCount || 1} {locale === 'da' ? 'Medlemmer' : 'Members'}
                                </span>
                                {group.finalDeadline ? (
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5" />
                                        {new Date(group.finalDeadline).toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">
                                        {locale === 'da' ? 'OPRETTET' : 'CREATED'} {group.createdAt?.toDate().toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-slate-700 transition-colors mb-2 line-clamp-2 tracking-tight">{group.name}</h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 pr-4">{group.description || (locale === 'da' ? 'Ingen beskrivelse tilføjet.' : 'No description added.')}</p>
                    </div>

                    <div className="relative z-10 pt-6 flex items-center justify-between border-t border-slate-50 group-hover:border-slate-100 transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
                            {locale === 'da' ? 'Åbn gruppens rum' : 'Open workspace'}
                        </span>
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const t = {
      da: {
          title: "Cohéro Project",
          subtitle: "Studiegrupper",
          overview: "Oversigt",
          yourGroups: "Dine Grupper",
          noGroupsMenu: "Ingen grupper endnu.",
          tipsTitle: "Projekt Tip",
          tipsText: "Fjern distraktionerne. Et stærkt projekt kræver fokus på de faglige deadlines.",
          logout: "Log ud",
          settings: "Indstillinger",
          searchPlaceholder: "Find dit projekt...",
          createGroup: "Opret ny gruppe",
          premiumRequired: "Opgradering påkrævet",
          premiumDesc: "Du skal have et Group Pro eller Kollega+ medlemskab for at oprette nye studiegrupper.",
          premiumTooltipTitle: "Adgang påkrævet",
          premiumTooltipDesc: "Kun Group Pro eller Kollega+ medlemmer kan oprette nye grupper.",
          premiumTooltipLink: "Se medlemskaber her",
          activeGroups: "Aktive rum",
          activeGroupsDesc: "Oversigt over dine faglige fællesskaber.",
          groupsCount: "Grupper",
          noActiveGroupsTitle: "Ingen aktive grupper",
          noActiveGroupsDescPremium: "Du er endnu ikke medlem af nogen studiegrupper. Opret en selv herunder.",
          noActiveGroupsDescFree: "Du er endnu ikke medlem af nogen studiegrupper. Du kan blive inviteret af en kollega via din mail.",
          startFirstGroup: "Start dit første rum",
          newGroupTitle: "Nyt Kollega-Rum",
          newGroupSubtitle: "Giv jeres gruppe et navn og en kort beskrivelse.",
          groupNameLabel: "Rum-navn",
          groupNamePlaceholder: "F.eks. Semesterprojekt '26",
          groupDescLabel: "Beskrivelse (valgfri)",
          groupDescPlaceholder: "Hvad er jeres faglige fokus?",
          cancel: "Annuller",
          createAction: "Opret rum",
          creating: "Opretter...",
          inviteColleague: "Inviter kollega",
          inviteDesc: "Tilføj et nyt medlem til en af dine grupper.",
          successTitle: "Gruppe oprettet!",
          errorTitle: "Fejl",
          errorDesc: "Kunne ikke oprette gruppe.",
          findColleagues: "Find kolleger",
          scanTitle: "Find jeres studiegruppe",
          scanSubtitle: "Scan studiekammerats QR-kode eller start en session selv.",
          startSession: "Start ny session (Host)",
          scanAction: "Scan QR-kode",
          scanning: "Scanning i gang...",
          invalidQR: "Ugyldig QR-kode. Prøv igen.",
      },
      en: {
          title: "Cohéro Project",
          subtitle: "Study Groups",
          overview: "Overview",
          yourGroups: "Your Workspaces",
          noGroupsMenu: "No workspaces yet.",
          tipsTitle: "Project Tip",
          tipsText: "Remove distractions. A strong project requires focus on academic deadlines.",
          logout: "Log out",
          settings: "Settings",
          searchPlaceholder: "Find your project...",
          createGroup: "Create workspace",
          premiumRequired: "Upgrade required",
          premiumDesc: "You need Group Pro or Kollega+ membership to create new study groups.",
          premiumTooltipTitle: "Access required",
          premiumTooltipDesc: "Only Group Pro or Kollega+ members can create new workspaces.",
          premiumTooltipLink: "View memberships here",
          activeGroups: "Active Workspaces",
          activeGroupsDesc: "Overview of your professional communities.",
          groupsCount: "Groups",
          noActiveGroupsTitle: "No active workspaces",
          noActiveGroupsDescPremium: "You are not a member of any study groups yet. Create one yourself below.",
          noActiveGroupsDescFree: "You are not a member of any study groups yet. You can be invited by a colleague via your email.",
          startFirstGroup: "Start your first room",
          newGroupTitle: "New Workspace",
          newGroupSubtitle: "Give your group a name and a short description.",
          groupNameLabel: "Room name",
          groupNamePlaceholder: "E.g. Semester Project '26",
          inviteColleague: "Invite colleague",
          inviteDesc: "Add a new member to one of your groups.",
          groupDescLabel: "Description (optional)",
          groupDescPlaceholder: "What is your academic focus?",
          cancel: "Cancel",
          createAction: "Create room",
          creating: "Creating...",
          successTitle: "Workspace created!",
          errorTitle: "Error",
          errorDesc: "Could not create workspace.",
          findColleagues: "Find colleagues",
          scanTitle: "Find your study group",
          scanSubtitle: "Scan classmate's QR code or start a session yourself.",
          startSession: "Start new session (Host)",
          scanAction: "Scan QR code",
          scanning: "Scanning...",
          invalidQR: "Invalid QR code. Try again.",
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

  const handleStartJoinSession = () => {
    const tableId = Math.random().toString(36).substring(2, 11);
    router.push(`/rum/groups/join/${tableId}?lang=${locale}`);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Expected URL format: https://.../rum/groups/join/[tableId]
    try {
        const url = new URL(decodedText);
        if (url.pathname.includes('/rum/groups/join/')) {
            const tableId = url.pathname.split('/').pop();
            if (tableId) {
                router.push(`/rum/groups/join/${tableId}?lang=${locale}`);
                setIsScanningModalOpen(false);
                setIsScannerActive(false);
                return;
            }
        }
        toast({ variant: "destructive", title: currentT.invalidQR });
    } catch (e) {
        toast({ variant: "destructive", title: currentT.invalidQR });
    }
  };

  if (isUserLoading || groupsLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col lg:flex-row text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION - Premium Slate Look */}
      <aside className="w-80 bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-0 h-screen z-30 shadow-sm shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-slate-50">
            <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-slate-900/10 shrink-0">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{currentT.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{currentT.subtitle}</p>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all bg-slate-900 text-white shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                <LayoutDashboard className="w-4 h-4" /> {currentT.overview}
            </button>
            <Link href={`/rum/groups/settings?lang=${locale}`} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
                <Settings className="w-4 h-4" /> {currentT.settings}
            </Link>
            <button 
                onClick={() => setIsScanningModalOpen(true)}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
            >
                <QrCode className="w-4 h-4" /> {currentT.findColleagues}
            </button>
            <div className="pt-8 pb-3 px-5"><h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{currentT.yourGroups}</h3></div>
            {filteredGroups.map(group => (
                <Link key={group.id} href={`/rum/groups/view/${group.id}?lang=${locale}`} className="w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-between group active:scale-[0.98]">
                    <span className="truncate pr-4">{group.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
            ))}
            {filteredGroups.length === 0 && <p className="px-5 py-6 text-[11px] text-slate-400 italic font-medium">{currentT.noGroupsMenu}</p>}
        </nav>

        <div className="mt-auto border-t border-slate-50 bg-slate-50/20">
            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
                 <button 
                    onClick={() => handleLocaleChange('da')}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${locale === 'da' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                >
                    DA
                </button>
                <button 
                    onClick={() => handleLocaleChange('en')}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${locale === 'en' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                >
                    EN
                </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full p-8 py-6 flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors font-black uppercase text-[11px] tracking-widest"
            >
              <LogOut className="w-4 h-4" /> {currentT.logout}
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-visible">
        
        {/* Dynamic Global Header (Standalone Version) */}
        <header className={`h-24 px-5 sm:px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 transition-all ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
            <div className="flex items-center gap-4 flex-1 max-w-2xl relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    placeholder={currentT.searchPlaceholder}
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 focus:outline-none transition-all text-[15px] font-bold h-14 shadow-sm"
                />
            </div>
            
            <div className="flex items-center gap-4 ml-6">
                <TooltipProvider>
                    <Tooltip open={!hasAccess ? undefined : false}>
                        <TooltipTrigger asChild>
                            <div className="hidden md:block">
                                <Button 
                                    onClick={() => hasAccess ? setIsCreating(true) : router.push(`/rum/groups/upgrade`)} 
                                    size="lg" 
                                    className={`rounded-[18px] h-14 px-8 shadow-xl shadow-slate-900/10 active:scale-95 transition-all text-[15px] font-black uppercase tracking-widest ${!hasAccess ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-none' : 'bg-slate-900 text-white'}`}
                                >
                                    {!hasAccess ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {currentT.createGroup}
                                </Button>
                                <Button 
                                    onClick={() => setIsScanningModalOpen(true)}
                                    size="lg" 
                                    variant="outline"
                                    className="rounded-[18px] h-14 px-8 border-slate-200 text-slate-900 bg-white hover:bg-slate-50 transition-all text-[15px] font-black uppercase tracking-widest ml-3 shadow-sm active:scale-95"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    {currentT.findColleagues}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!hasAccess && (
                            <TooltipContent side="bottom" className="bg-slate-900 text-white p-5 max-w-xs border-slate-800 shadow-2xl rounded-2xl">
                                <div className="space-y-3">
                                    <p className="font-black flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest"><Sparkles className="w-4 h-4 fill-amber-400"/> {currentT.premiumTooltipTitle}</p>
                                    <p className="text-[13px] text-slate-300 leading-relaxed font-medium">{currentT.premiumTooltipDesc}</p>
                                    <Link href={`/rum/groups/upgrade`} className="text-xs font-bold text-white underline flex items-center gap-1.5 mt-2 hover:text-amber-400 transition-colors">{currentT.premiumTooltipLink} <ArrowUpRight className="w-3.5 h-3.5"/></Link>
                                </div>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <div className="lg:hidden flex items-center gap-3">
                    <button onClick={() => setIsCreating(true)} className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsScanningModalOpen(true)} className="w-12 h-12 bg-white border border-slate-100 text-slate-900 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
                        <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={handleLogout} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>

        <div className="p-5 sm:p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-12 sm:space-y-20">
            {/* HERO / WELCOME SECTION */}
            <header className="space-y-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-200/40">
                    <Sparkles className="w-3 h-3" /> Professional Collaboration
                </motion.div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase tracking-tighter">{currentT.activeGroups}</h2>
                        <p className="text-lg text-slate-500 mt-4 font-medium max-w-lg">{currentT.activeGroupsDesc}</p>
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
                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200">
                            <Users className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight uppercase tracking-tighter">{currentT.noActiveGroupsTitle}</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-12 leading-relaxed font-medium">{hasAccess ? currentT.noActiveGroupsDescPremium : currentT.noActiveGroupsDescFree}</p>
                        {hasAccess && (
                            <Button 
                              onClick={() => setIsCreating(true)} 
                              size="lg" 
                              className="rounded-2xl h-16 px-12 bg-slate-900 text-white font-black uppercase tracking-widest text-[15px] shadow-2xl active:scale-95 transition-all"
                            >
                                {currentT.startFirstGroup}
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 auto-rows-fr">
                        {/* New Group Card inside grid */}
                        {hasAccess && (
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
                                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 tracking-tight uppercase tracking-tighter">{currentT.createGroup}</h3>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px]">{currentT.newGroupSubtitle}</p>
                              </div>
                          </motion.div>
                        )}
                        
                        {filteredGroups.map((group, idx) => (
                            <GroupCard key={group.id} group={group} idx={idx + 1} locale={locale} />
                        ))}
                    </div>
                )}
            </section>
        </div>

        {/* Mobile menu bar spacer */}
        <div className="h-24 lg:hidden"></div>
      </main>

      {/* CREATE MODAL - Premium Overhaul */}
      <AnimatePresence>
        {isCreating && hasAccess && (
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
                <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-white shadow-2xl">
                    <PlusCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">{currentT.newGroupTitle}</h2>
                <p className="text-sm text-slate-500 font-medium">{currentT.newGroupSubtitle}</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.groupNameLabel}</label>
                    <Input 
                        placeholder={currentT.groupNamePlaceholder}
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)} 
                        className="h-16 rounded-2xl bg-white border-slate-100 shadow-inner focus:ring-8 focus:ring-slate-900/5 focus:border-slate-300 text-[16px] font-bold px-6"
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">{currentT.groupDescLabel}</label>
                    <Textarea 
                        placeholder={currentT.groupDescPlaceholder}
                        value={newGroupDesc} 
                        onChange={e => setNewGroupDesc(e.target.value)} 
                        className="rounded-[24px] min-h-[140px] bg-white border-slate-100 shadow-inner focus:ring-8 focus:ring-slate-900/5 focus:border-slate-300 text-[15px] font-medium p-6"
                    />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="h-16 rounded-[20px] font-bold text-slate-400 order-2 sm:order-1">{currentT.cancel}</Button>
                <Button type="submit" disabled={isSaving} className="flex-grow h-16 rounded-[20px] bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all order-1 sm:order-2">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : currentT.createAction}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* SCAN / JOIN MODAL */}
      <AnimatePresence>
        {isScanningModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                onClick={() => {
                    setIsScanningModalOpen(false);
                    setIsScannerActive(false);
                }}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-[#FDFBF7] w-full max-w-lg rounded-[48px] shadow-2xl p-8 sm:p-12 space-y-8 border border-white overflow-hidden"
            >
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                    <QrCode className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">{currentT.scanTitle}</h2>
                <p className="text-sm text-slate-500 font-medium px-4">{currentT.scanSubtitle}</p>
              </div>

              <div className="space-y-4">
                {isScannerActive ? (
                  <div className="space-y-6">
                    <QRScanner onScanSuccess={handleScanSuccess} />
                    <Button 
                        onClick={() => setIsScannerActive(false)}
                        variant="ghost" 
                        className="w-full h-14 rounded-2xl text-rose-500 font-bold"
                    >
                        {currentT.cancel}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={handleStartJoinSession}
                        className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-[32px] hover:border-slate-900 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{locale === 'da' ? 'Jeg viser koden' : 'I show the code'}</span>
                        <span className="text-lg font-black text-slate-900">{currentT.startSession}</span>
                    </button>

                    <button 
                        onClick={() => setIsScannerActive(true)}
                        className="group flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-[32px] hover:border-slate-900 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{locale === 'da' ? 'Jeg scanner' : 'I am scanning'}</span>
                        <span className="text-lg font-black text-slate-900">{currentT.scanAction}</span>
                    </button>
                    
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsScanningModalOpen(false)}
                        className="h-16 rounded-[20px] font-bold text-slate-400"
                    >
                        {currentT.cancel}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
