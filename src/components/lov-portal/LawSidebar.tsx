
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
import { motion } from 'framer-motion';

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
    <aside className="w-96 bg-[#FDFCF8] flex flex-col sticky top-0 h-screen z-30 transition-all duration-1000 hidden lg:flex border-r border-slate-100/50 group/sidebar">
      {/* Brand Sanctuary Header */}
      <div className="p-16 flex flex-col gap-10 border-b border-slate-100/20">
          <motion.div 
            initial={{ rotate: -5 }}
            whileHover={{ rotate: 5 }}
            className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-950/40 rotate-1 shrink-0 animate-ink"
          >
            <Scale className="w-10 h-10" />
          </motion.div>
          <div>
              <h1 className="text-3xl font-black text-slate-950 serif tracking-tighter leading-none group-hover/sidebar:tracking-tight transition-all duration-1000">Lovportal</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mt-3 flex items-center gap-3 italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
                  Edition 2026
              </p>
          </div>
      </div>

      {/* Elegant Librarian Navigation */}
      <nav className="flex-1 px-10 py-16 space-y-4 overflow-y-auto custom-scrollbar">
          <MenuButton 
            active={viewMode === 'laws' && !activeLawId} 
            onClick={onDashboardClick} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Bibliotek" 
          />
          <MenuButton 
            active={viewMode === 'saved'} 
            onClick={() => setViewMode('saved')} 
            icon={<Bookmark className="w-5 h-5" />} 
            label="Gemte Love" 
          />
          <MenuButton 
            active={viewMode === 'training'} 
            onClick={() => setViewMode('training')} 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Min Træning" 
          />
          <div className="h-px bg-slate-100/30 my-10 mx-6" />

          <p className="px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6 italic">Top 10 opslagsværker</p>
          
          {(lawsConfigs || []).slice(0, 10).map((law, idx) => {
              const isLocked = !isPremium && idx > 0;
              const isActive = activeLawId === law.id;
              return (
                  <button 
                      key={law.id} 
                      disabled={isLocked} 
                      onClick={() => onLawClick(law.id)} 
                      className={`w-full text-left px-8 py-4 rounded-[1.5rem] transition-all duration-700 flex items-center justify-between group/nav ${isActive ? 'bg-white shadow-2xl border-slate-50 text-slate-950 underline decoration-amber-400 decoration-3 underline-offset-8' : 'text-slate-400 hover:bg-white hover:text-slate-950'} ${isLocked ? 'opacity-30 grayscale' : 'hover:translate-x-1'}`}
                  >
                      <span className="truncate pr-4 font-black serif text-base tracking-tight">{law.name}</span>
                      {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <ChevronRight className={`w-4 h-4 transition-all duration-700 ${isActive ? 'opacity-100 translate-x-0 text-amber-950' : 'opacity-0 -translate-x-2 group-hover/nav:opacity-100 group-hover/nav:translate-x-0'}`} />}
                  </button>
              )
          })}
      </nav>
      
      {/* Premium Profile Footer */}
      <div className="p-10 pb-20 border-t border-slate-50/20">
          <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 group/user">
              <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 shrink-0 rounded-[1.5rem] bg-slate-950 flex items-center justify-center text-amber-400 font-bold text-lg shadow-2xl group-hover/user:rotate-6 transition-transform duration-1000">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                      <p className="text-base font-black text-slate-950 truncate serif leading-tight">{userProfile?.displayName || (user?.email && user.email.split('@')[0])}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mt-2 flex items-center gap-2">
                          <Sparkles className="w-3 h-3 fill-amber-500" />
                          {userProfile?.membership || 'Student'}
                      </p>
                  </div>
              </div>
          </div>
      </div>
    </aside>
  );
};

const MenuButton = ({ active, onClick, icon, label }: any) => (
   <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-6 px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-1000 group/nav ${active ? 'bg-slate-950 text-white shadow-3xl shadow-slate-950/20 translate-x-2' : 'text-slate-300 hover:bg-white hover:text-slate-950 hover:translate-x-1'}`}
   >
      <div className={`transition-transform duration-1000 ${active ? 'scale-125 text-amber-400' : 'group-hover/nav:scale-110'}`}>{icon}</div>
      {label}
   </button>
);
