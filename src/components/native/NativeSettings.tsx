'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  User, 
  CreditCard, 
  Bell, 
  ShieldAlert, 
  ChevronRight, 
  LogOut, 
  HelpCircle, 
  Info,
  Smartphone,
  BookOpen,
  GraduationCap,
  Loader2,
  CheckCircle,
  BellOff
} from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { createPortalSessionAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { requestNotificationPermission } from '@/firebase/messaging';

const NativeSettings: React.FC = () => {
  const { user, userProfile, handleLogout } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleAction = (callback: () => void) => {
    triggerHapticFeedback(ImpactStyle.Light);
    callback();
  };

  const handleManageSubscription = async () => {
    if (!userProfile?.stripeCustomerId) {
      toast({ title: "Ingen betalingsinfo", description: "Du har ikke tilknyttet en betalingsmetode endnu." });
      return;
    };
    setIsPortalLoading(true);
    try {
      const { url } = await createPortalSessionAction(userProfile.stripeCustomerId);
      window.location.href = url;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Portal Fejl', description: 'Kunne ikke indlæse betalingsportalen.' });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    setIsRequestingNotifications(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setNotificationStatus('granted');
        toast({ title: 'Notifikationer aktive', description: 'Du modtager nu push-beskeder.' });
      }
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Fejl', 
        description: err.message || 'Kunne ikke aktivere notifikationer.' 
      });
      triggerHapticFeedback(ImpactStyle.Heavy);
    } finally {
      setIsRequestingNotifications(false);
    }
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="px-5 mb-2 text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h2>
      <div className="bg-white border-y border-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const Item = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    color = "indigo",
    destructive = false,
    loading = false
  }: { 
    icon: any, 
    label: string, 
    value?: string, 
    onClick?: () => void,
    color?: string,
    destructive?: boolean,
    loading?: boolean
  }) => (
    <button 
      onClick={() => onClick && !loading && handleAction(onClick)}
      disabled={loading}
      className="w-full flex items-center px-4 py-4 active:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 text-left"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mr-3 ${
        destructive ? 'bg-rose-50 text-rose-600' : `bg-${color}-50 text-${color}-600`
      }`}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-bold truncate ${destructive ? 'text-rose-600' : 'text-slate-900'}`}>{label}</p>
        {value && <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">{value}</p>}
      </div>
      {onClick && !loading && <ChevronRight className="w-5 h-5 text-slate-200 ml-2" />}
    </button>
  );

  return (
    <div className="pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 min-h-screen">
      {/* Profile Header */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-8 flex items-center gap-5">
        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black border-4 border-white shadow-2xl relative overflow-hidden">
          {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
          <div className="absolute top-0 right-0 p-2 text-white/10"><User className="w-12 h-12" /></div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none mb-2">{user?.displayName || 'Bruger'}</h1>
          <p className="text-xs font-bold text-slate-400 truncate max-w-[200px] mb-3">{user?.email}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
            {userProfile?.membership || 'Gratis Plan'}
          </div>
        </div>
      </div>

      <Section title="Personlig Info">
        <Item 
          icon={User} 
          label="Navn" 
          value={user?.displayName || 'Ikke angivet'} 
          color="blue"
        />
        <Item 
          icon={Smartphone} 
          label="Mobil" 
          value={userProfile?.phoneNumber || 'Ikke tilføjet'} 
          color="emerald"
        />
      </Section>

      <Section title="Uddannelse">
        <Item 
          icon={GraduationCap} 
          label="Studie" 
          value={userProfile?.profession || 'Vælg profession'} 
          color="indigo"
        />
        <Item 
          icon={BookOpen} 
          label="Institution" 
          value={userProfile?.institution || 'Vælg skole'} 
          color="violet"
        />
        <Item 
          icon={ChevronRight} 
          label="Semester" 
          value={userProfile?.semester ? `${userProfile.semester}. semester` : 'Ikke valgt'} 
          color="purple"
        />
      </Section>

      <Section title="Medlemskab">
        <Item 
          icon={CreditCard} 
          label="Abonnement" 
          value={userProfile?.membership === 'Gratis Plan' ? 'Opgrader og lås alt op' : 'Administrer dit medlemskab'} 
          color="amber"
          loading={isPortalLoading}
          onClick={handleManageSubscription}
        />
      </Section>

      <Section title="App Indstillinger">
        <Item 
          icon={notificationStatus === 'granted' ? Bell : BellOff} 
          label="Notifikationer" 
          value={notificationStatus === 'granted' ? "Push-beskeder er aktive ✅" : "Klik for at aktivere"} 
          color="rose"
          loading={isRequestingNotifications}
          onClick={handleEnableNotifications}
        />
        <Item 
          icon={ShieldAlert} 
          label="Sikkerhed" 
          value="Beskyt din konto" 
          color="slate"
        />
      </Section>

      <Section title="Om Cohéro">
        <Item 
          icon={HelpCircle} 
          label="Support & FAQ" 
          color="sky"
          onClick={() => window.open('https://cohero.dk/support', '_blank')}
        />
        <Item 
          icon={Info} 
          label="Om os" 
          color="slate"
          onClick={() => window.open('https://cohero.dk/om-os', '_blank')}
        />
      </Section>

      <div className="px-5 mt-6 space-y-4">
        <button 
          onClick={() => handleAction(handleLogout)}
          className="w-full h-14 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-3 font-black text-rose-500 uppercase tracking-widest text-[11px] active:bg-rose-50 transition-all shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Log ud af Cohéro Student
        </button>
        
        <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] pt-6">
          Version 4.0.0 (Native iOS Build)
        </p>
      </div>
    </div>
  );
};

export default NativeSettings;
