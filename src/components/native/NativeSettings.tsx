'use client';

import React from 'react';
import { useApp } from '@/app/provider';
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
  GraduationCap
} from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

const NativeSettings: React.FC = () => {
  const { user, userProfile, handleLogout } = useApp();

  const handleAction = (callback: () => void) => {
    triggerHapticFeedback(ImpactStyle.Light);
    callback();
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="px-5 mb-2 text-[13px] font-medium text-slate-500 uppercase tracking-wider">{title}</h2>
      <div className="bg-white border-y border-slate-200 overflow-hidden">
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
    destructive = false 
  }: { 
    icon: any, 
    label: string, 
    value?: string, 
    onClick?: () => void,
    color?: string,
    destructive?: boolean
  }) => (
    <button 
      onClick={() => onClick && handleAction(onClick)}
      className="w-full flex items-center px-4 py-3 active:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 text-left"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
        destructive ? 'bg-rose-50 text-rose-600' : `bg-${color}-50 text-${color}-600`
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-medium truncate ${destructive ? 'text-rose-600' : 'text-slate-900'}`}>{label}</p>
        {value && <p className="text-[13px] text-slate-400 truncate mt-0.5">{value}</p>}
      </div>
      {onClick && <ChevronRight className="w-5 h-5 text-slate-300 ml-2" />}
    </button>
  );

  return (
    <div className="pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="px-5 pt-2 pb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-black border-4 border-slate-100 shadow-xl">
          {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">{user?.displayName || 'Bruger'}</h1>
          <p className="text-sm font-medium text-slate-500">{user?.email}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest">
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
          value={userProfile?.membership || 'Prøv Kollega+'} 
          color="amber"
          onClick={() => {}}
        />
      </Section>

      <Section title="App Indstillinger">
        <Item 
          icon={Bell} 
          label="Notifikationer" 
          value="Push-beskeder er aktive" 
          color="rose"
          onClick={() => {}}
        />
        <Item 
          icon={ShieldAlert} 
          label="Sikkerhed" 
          value="Beskyt din konto" 
          color="slate"
          onClick={() => {}}
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

      <div className="px-5 mt-4 space-y-4">
        <button 
          onClick={() => handleAction(handleLogout)}
          className="w-full h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 font-black text-rose-600 uppercase tracking-widest text-sm active:bg-rose-50 transition-all shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Log ud
        </button>
        
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
          Version 4.0.0 (Native Build)
        </p>
      </div>
    </div>
  );
};

export default NativeSettings;
