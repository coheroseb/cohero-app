'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  Settings, 
  User, 
  Globe, 
  Bell, 
  BellOff, 
  LogOut, 
  ChevronRight, 
  LayoutDashboard,
  CheckCircle,
  Loader2,
  Lock,
  Sparkles,
  ArrowUpRight,
  QrCode
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { requestNotificationPermission } from '@/firebase/messaging';

interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export default function GroupsSettingsPage() {
  const { user, userProfile, isUserLoading, handleLogout, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [locale, setLocale] = useState<'da' | 'en'>('da');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('unsupported');
    }
  }, []);

  const handleLocaleChange = (newLocale: 'da' | 'en') => {
    setLocale(newLocale);
    localStorage.setItem('cohero_groups_locale', newLocale);
    router.refresh();
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    setIsRequestingNotifications(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setNotificationStatus('granted');
        toast({
          title: locale === 'da' ? 'Notifikationer slået til' : 'Notifications enabled',
          description: locale === 'da' ? 'Du vil nu modtage push-beskeder på denne enhed.' : 'You will now receive push notifications on this device.',
        });
      } else {
        setNotificationStatus(Notification.permission);
      }
    } catch (err: any) {
      console.error(err);
      setNotificationStatus(Notification.permission);
      toast({
        variant: 'destructive',
        title: locale === 'da' ? 'Der skete en fejl' : 'An error occurred',
        description: err.message || (locale === 'da' ? 'Kunne ikke aktivere notifikationer.' : 'Could not enable notifications.'),
      });
    } finally {
      setIsRequestingNotifications(false);
    }
  };

  const t = {
    da: {
      title: "Cohéro Project",
      subtitle: "Studiegrupper",
      overview: "Oversigt",
      settings: "Indstillinger",
      settingsDesc: "Administrer præferencer for dit personlige rum.",
      findColleagues: "Find kolleger",
      yourGroups: "Dine Grupper",
      noGroupsMenu: "Ingen grupper endnu.",
      logout: "Log ud",
      profileSection: "Din Profil",
      profileDesc: "Dobbelt-tjek dine overordnede platform-indstillinger.",
      editProfile: "Rediger offentlig profil",
      languageSection: "Sprog",
      languageDesc: "Vælg dit foretrukne sprog til grænsefladen.",
      notificationSection: "Notifikationer",
      notificationDesc: "Modtag push-beskeder om nye opgaver og opdateringer på projektet.",
      enable: "Aktivér Notifikationer",
      enabled: "Aktiveret",
      unsupported: "Ikke understøttet i denne browser",
      denied: "Blokeret i browseren",
      backToGroups: "Tilbage til oversigten",
    },
    en: {
      title: "Cohéro Project",
      subtitle: "Study Groups",
      overview: "Overview",
      settings: "Settings",
      settingsDesc: "Manage preferences for your personal workspace.",
      findColleagues: "Find colleagues",
      yourGroups: "Your Workspaces",
      noGroupsMenu: "No workspaces yet.",
      logout: "Log out",
      profileSection: "Your Profile",
      profileDesc: "Double-check your overall platform settings.",
      editProfile: "Edit public profile",
      languageSection: "Language",
      languageDesc: "Choose your preferred language for the interface.",
      notificationSection: "Notifications",
      notificationDesc: "Receive push notifications about new tasks and project updates.",
      enable: "Enable Notifications",
      enabled: "Enabled",
      unsupported: "Not supported in this browser",
      denied: "Blocked in browser",
      backToGroups: "Back to overview",
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

  const { data: userGroups } = useCollection<Group>(groupsQuery);

  if (isUserLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION - Premium Slate Look Matches Home */}
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
            <Link href={`/rum/groups?lang=${locale}`} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
                <LayoutDashboard className="w-4 h-4" /> {currentT.overview}
            </Link>
            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all bg-slate-900 text-white shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                <Settings className="w-4 h-4" /> {currentT.settings}
            </button>
            <button 
                onClick={() => router.push(`/rum/groups?lang=${locale}&scan=true`)}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
            >
                <QrCode className="w-4 h-4" /> {currentT.findColleagues}
            </button>
            <div className="pt-8 pb-3 px-5"><h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{currentT.yourGroups}</h3></div>
            {userGroups?.map(group => (
                <Link key={group.id} href={`/rum/groups/view/${group.id}?lang=${locale}`} className="w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-between group active:scale-[0.98]">
                    <span className="truncate pr-4">{group.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
            ))}
            {(!userGroups || userGroups.length === 0) && <p className="px-5 py-6 text-[11px] text-slate-400 italic font-medium">{currentT.noGroupsMenu}</p>}
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
        <header className={`h-24 px-5 sm:px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 transition-all ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
            <div className="flex items-center gap-4">
                <Link href={`/rum/groups?lang=${locale}`}>
                    <Button variant="ghost" size="lg" className="rounded-2xl gap-2 font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all text-sm h-14 uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" />
                        {currentT.backToGroups}
                    </Button>
                </Link>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="lg:hidden flex items-center gap-3">
                    <button 
                      onClick={handleLogout}
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>

        <div className="p-5 sm:p-8 md:p-12 lg:p-16 max-w-4xl mx-auto w-full space-y-12 sm:space-y-16">
            <header className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase tracking-tighter">{currentT.settings}</h2>
                <p className="text-lg text-slate-500 mt-4 font-medium max-w-lg">{currentT.settingsDesc}</p>
            </header>

            <div className="space-y-8">
                <motion.section 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-white shadow-lg">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{currentT.profileSection}</h3>
                        </div>
                        <p className="text-[13px] font-bold text-slate-500">{currentT.profileDesc}</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <p className="text-lg font-black text-slate-900">{userProfile?.username || user?.displayName || 'Anonym'}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">{user?.email}</p>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-inner shadow-white/20">
                                <Sparkles className="w-3 h-3" /> {userProfile?.membership || 'Kollega'}
                            </div>
                        </div>
                    </div>
                    
                    <Link href="/settings" className="w-full md:w-auto">
                        <Button variant="outline" className="w-full md:w-auto h-16 px-8 rounded-[20px] bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-900 font-bold uppercase text-[11px] tracking-widest transition-all hover:border-slate-900 group">
                            {currentT.editProfile}
                            <ArrowUpRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </Link>
                </motion.section>

                <motion.section 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
                >
                    <div className="space-y-4 max-w-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-slate-600 border border-slate-100">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{currentT.languageSection}</h3>
                        </div>
                        <p className="text-[13px] font-bold text-slate-500 pr-5">{currentT.languageDesc}</p>
                    </div>
                    
                    <div className="flex gap-4 p-2 bg-slate-50 rounded-[24px] border border-slate-100 w-full md:w-auto">
                        <button 
                            onClick={() => handleLocaleChange('da')}
                            className={`flex-[1] min-w-[120px] py-4 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${locale === 'da' ? 'bg-white shadow-lg text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            Dansk
                        </button>
                        <button 
                            onClick={() => handleLocaleChange('en')}
                            className={`flex-[1] min-w-[120px] py-4 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${locale === 'en' ? 'bg-white shadow-lg text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            English
                        </button>
                    </div>
                </motion.section>

                <motion.section 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                  className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-b-0">
                        <div className="space-y-6 flex-1 max-w-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-50 rounded-[18px] flex items-center justify-center text-amber-600 border border-amber-100">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{currentT.notificationSection}</h3>
                            </div>
                            <p className="text-[13px] font-bold text-slate-500">{currentT.notificationDesc}</p>
                            
                            <div className="p-5 bg-slate-50 rounded-[20px] border border-slate-100 inline-flex items-center gap-4">
                                {notificationStatus === 'granted' ? (
                                    <div className="flex items-center gap-3 text-emerald-600 font-bold text-[13px] uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        {currentT.enabled}
                                    </div>
                                ) : notificationStatus === 'denied' ? (
                                    <div className="flex items-center gap-3 text-rose-500 font-bold text-[13px] uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                            <BellOff className="w-4 h-4" />
                                        </div>
                                        {currentT.denied}
                                    </div>
                                ) : notificationStatus === 'unsupported' ? (
                                    <div className="flex items-center gap-3 text-slate-400 font-bold text-[13px] uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <BellOff className="w-4 h-4" />
                                        </div>
                                        {currentT.unsupported}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-600 font-bold text-[13px] uppercase tracking-widest">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        Notifikationer Off
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {(notificationStatus === 'default' || notificationStatus === 'granted') && (
                            <Button 
                                onClick={handleEnableNotifications} 
                                disabled={isRequestingNotifications}
                                className={`h-16 px-8 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all w-full md:w-auto ${notificationStatus === 'granted' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none' : 'bg-slate-900 text-white'}`}
                            >
                                {isRequestingNotifications ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {notificationStatus === 'granted' ? (locale === 'da' ? 'Opdater Præference' : 'Update Preference') : currentT.enable}
                            </Button>
                        )}
                    </div>
                </motion.section>
            </div>
            
            {/* Mobile bottom margin for nav spacing */}
            <div className="h-24 lg:hidden"></div>
        </div>
      </main>
    </div>
  );
}

