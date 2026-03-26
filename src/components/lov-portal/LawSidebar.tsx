
'use client';

import React from 'react';
import { 
  ChevronRight, 
  X, 
  Library, 
  LayoutDashboard, 
  Bookmark, 
  TrendingUp, 
  Gavel, 
  Folders, 
  Lock, 
  Sparkles,
  ArrowRight,
  Scale
} from 'lucide-react';
import { LawConfig, LawContentType } from '@/ai/flows/types';

interface LawSidebarProps {
  viewMode: string;
  setViewMode: (mode: any) => void;
  activeLawId: string | null;
  lawsConfigs: LawConfig[];
  isPremium: boolean;
  user: any;
  userProfile: any;
  onLawClick: (id: string) => void;
  onDashboardClick: () => void;
}

export const LawSidebar = ({
  viewMode,
  setViewMode,
  activeLawId,
  lawsConfigs,
  isPremium,
  user,
  userProfile,
  onLawClick,
  onDashboardClick
}: LawSidebarProps) => {

  return (
    <aside className="w-80 bg-white/60 backdrop-blur-3xl border-r border-amber-100 flex flex-col sticky top-0 h-screen z-30 transition-all duration-700 hidden lg:flex">
      {/* Brand Header */}
      <div className="p-10 flex items-center gap-4 border-b border-amber-50/50">
          <div className="w-14 h-14 bg-amber-950 rounded-[1.5rem] flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-950/40 rotate-1 shrink-0 animate-ink"><Scale className="w-8 h-8" /></div>
          <div>
              <h1 className="text-2xl font-black text-amber-950 serif tracking-tighter leading-none">Lovportal</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/30 mt-1.5 flex items-center gap-2 italic">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  Premium Edition
              </p>
          </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-6 py-10 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
              onClick={onDashboardClick} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all group/nav ${viewMode === 'laws' && !activeLawId ? 'bg-amber-950 text-white shadow-2xl shadow-amber-900/40 translate-x-1' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
          >
              <LayoutDashboard className="w-5 h-5 shrink-0" /> Oversigt
          </button>
          <button 
              onClick={() => setViewMode('saved')} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all group/nav ${viewMode === 'saved' ? 'bg-amber-950 text-white shadow-2xl shadow-amber-900/40 translate-x-1' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
          >
              <Bookmark className="w-5 h-5 shrink-0" /> Gemte kilder
          </button>
          <button 
              onClick={() => setViewMode('training')} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all group/nav ${viewMode === 'training' ? 'bg-amber-950 text-white shadow-2xl shadow-amber-900/40 translate-x-1' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
          >
              <TrendingUp className="w-5 h-5 shrink-0" /> Min Træning
          </button>
          <button 
              onClick={() => setViewMode('reforms')} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all group/nav ${viewMode === 'reforms' ? 'bg-amber-950 text-white shadow-2xl shadow-amber-900/40 translate-x-1' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
          >
              <Gavel className="w-5 h-5 shrink-0" /> Lov-reformer
          </button>
          
          <div className="pt-12 pb-6 px-6">
              <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-amber-100/60"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Bibliotek</h3>
                  <div className="h-px flex-1 bg-amber-100/60"></div>
              </div>
          </div>
          
          {(lawsConfigs || []).map((law, idx) => {
              const isLocked = !isPremium && idx > 0;
              const isActive = activeLawId === law.id;
              return (
                  <button 
                      key={law.id} 
                      disabled={isLocked} 
                      onClick={() => onLawClick(law.id)} 
                      className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group/nav ${isActive ? 'bg-amber-50 text-amber-950 border border-amber-200' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-950'} ${isLocked ? 'opacity-40 grayscale' : 'hover:translate-x-1'}`}
                  >
                      <span className="truncate pr-4 font-bold">{law.name}</span>
                      {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <ChevronRight className={`w-4 h-4 transition-all ${isActive ? 'opacity-100 translate-x-0 text-amber-950' : 'opacity-0 -translate-x-2 group-hover/nav:opacity-100 group-hover/nav:translate-x-0'}`} />}
                  </button>
              )
          })}
      </nav>
      
      {/* User Footer */}
      <div className="p-8 border-t border-amber-50/50">
          <div className="p-6 rounded-[2.5rem] bg-slate-50/50 border border-transparent hover:border-amber-200 hover:bg-white transition-all group/user">
              <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-400 font-bold text-base shadow-xl group-hover/user:rotate-3 transition-transform">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                      <p className="text-sm font-black text-amber-950 truncate serif leading-tight">{userProfile?.displayName || (user?.email && user.email.split('@')[0])}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          {userProfile?.membership || 'Student'}
                      </p>
                  </div>
              </div>
          </div>
      </div>
    </aside>
  );
};
