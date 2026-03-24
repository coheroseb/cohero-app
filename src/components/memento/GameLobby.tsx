'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Zap, 
  CheckCircle, 
  Layers, 
  Filter, 
  TrendingUp, 
  Bookmark, 
  Medal, 
  Activity, 
  PlusCircle, 
  MousePointer2, 
  ChevronRight,
  Brain,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameType, gameDataSets } from '@/app/memento/page';

interface GameLobbyProps {
  userProfile: any;
  hasPlayedDailyChallenge: boolean;
  dailyChallengeGameType: GameType;
  onSelectGame: (gameType: GameType) => void;
}

const PremiumGlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}
    >
        {children}
    </div>
);

const GameSelectionCard = ({ icon, title, description, level, colorGradient, accentColor, onSelect }: { icon: React.ReactNode, title: string, description: string, level: number, colorGradient: string, accentColor: string, onSelect: () => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      className="group relative h-full"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-700 rounded-[3rem]`} />
        
        <PremiumGlassCard 
            className="p-10 h-full flex flex-col hover:border-amber-200/50 hover:shadow-2xl hover:shadow-amber-950/5 transition-all duration-700 cursor-pointer overflow-hidden"
            onClick={onSelect}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl bg-gradient-to-br ${colorGradient} text-white group-hover:rotate-6 transition-transform duration-500`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-8 h-8' })}
            </div>
            
            <div className="flex-grow">
                <h3 className="text-3xl font-black text-amber-950 serif mb-4 tracking-tight leading-none">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed italic mb-10 group-hover:text-amber-900/60 transition-colors">"{description}"</p>
            </div>
            
            <div className="pt-8 border-t border-amber-50/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Fremdrift</span>
                  <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${accentColor}`}>Level {level + 1}</span>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-950 group-hover:text-white group-hover:border-amber-950 transition-all duration-500 shadow-sm">
                    <MousePointer2 className="w-5 h-5" />
                </div>
            </div>
        </PremiumGlassCard>
    </motion.div>
  );
};

export const GameLobby: React.FC<GameLobbyProps> = ({ 
  userProfile, 
  hasPlayedDailyChallenge, 
  dailyChallengeGameType, 
  onSelectGame 
}) => {
  return (
    <div className="relative z-10">
      {/* 1. HERO HEADER */}
      <header className="px-6 py-20 md:py-32 relative">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
              <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-10 px-6 py-2 bg-amber-950 text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl border border-white/10"
              >
                  Dannelses-Modul: Memento
              </motion.div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-amber-950 serif leading-[0.9] tracking-tighter mb-8 max-w-5xl">
                  Hvad rører sig i <br /><span className="text-emerald-600 italic">din bevidsthed?</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl italic leading-relaxed font-medium mb-16">
                  Match teoriapper, paragraffer og viden i sjove og lærerige spil.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6">
                  <PremiumGlassCard className="px-10 py-6 flex items-center gap-6 border-amber-950/5">
                      <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Dannelses Point</p>
                          <p className="text-3xl font-black text-amber-950 serif leading-none">{userProfile?.cohéroPoints || 0}</p>
                      </div>
                      <div className="w-px h-10 bg-amber-950/5" />
                      <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Nuværende Rank</p>
                          <div className="flex items-center gap-2">
                              <Medal className="w-5 h-5 text-amber-500" />
                              <p className="text-2xl font-black text-amber-950 serif leading-none">{Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}</p>
                          </div>
                      </div>
                  </PremiumGlassCard>
                  
                  <div className="flex gap-4">
                      <Button variant="ghost" className="h-16 px-8 rounded-2xl hover:bg-white/50 text-slate-400 hover:text-amber-950 font-bold uppercase text-[10px] tracking-widest transition-all">
                          <TrendingUp className="w-4 h-4 mr-3" /> Stats
                      </Button>
                      <Button variant="ghost" className="h-16 px-8 rounded-2xl hover:bg-white/50 text-slate-400 hover:text-amber-950 font-bold uppercase text-[10px] tracking-widest transition-all">
                          <Bookmark className="w-4 h-4 mr-3" /> Bedrifter
                      </Button>
                  </div>
              </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-40">
          <div className="grid lg:grid-cols-12 gap-16 xl:gap-24">
              <div className="lg:col-span-8 space-y-24">
                  {/* Daily Challenge - The "Big Action" */}
                  <section className="relative">
                      <motion.div 
                          whileHover={{ scale: 1.01 }}
                          onClick={() => !hasPlayedDailyChallenge && onSelectGame(dailyChallengeGameType)}
                          className="bg-amber-950 p-12 md:p-24 rounded-[4rem] text-white shadow-[0_40px_80px_-20px_rgba(69,26,3,0.3)] relative overflow-hidden group cursor-pointer"
                      >
                          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-[150px] -mr-[400px] -mt-[400px] pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
                          
                          <div className="relative z-10 grid md:grid-cols-[1fr_250px] gap-12 items-center">
                              <div className="space-y-8">
                                  <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                                      <Sparkles className="w-4 h-4 text-emerald-200" /> Dagens Udfordring
                                  </div>
                                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-black serif leading-[1.1] tracking-tight transition-transform group-hover:translate-x-2 duration-700">
                                      Boost din <span className="text-emerald-400 italic">streak</span> <br />& få dobbelt op
                                  </h3>
                                  <p className="text-amber-100/50 text-xl font-medium italic leading-relaxed max-w-xl">
                                      {hasPlayedDailyChallenge 
                                          ? "Godt klaret! Du har allerede styrket din streak i dag."
                                          : `Gennemfør ${gameDataSets[dailyChallengeGameType].title} for at låse op for bonuspoint.`
                                      }
                                  </p>
                                  <Button disabled={hasPlayedDailyChallenge} size="lg" className="h-20 px-12 rounded-[2rem] bg-emerald-500 text-white hover:bg-white hover:text-emerald-900 border-none font-black uppercase text-xs tracking-widest transition-all disabled:bg-emerald-600">
                                      {hasPlayedDailyChallenge ? <><CheckCircle className="w-5 h-5 mr-3" /> Gennemført i dag</> : <><Zap className="w-5 h-5 mr-3 text-amber-300" /> Start nu</>}
                                  </Button>
                              </div>

                              <div className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center backdrop-blur-md relative group-hover:bg-white/10 transition-all duration-700">
                                  <div className="w-20 h-20 bg-emerald-400 rounded-3xl flex items-center justify-center text-emerald-950 mb-6 shadow-2xl relative">
                                      <Flame className="w-10 h-10 fill-current" />
                                      <div className="absolute inset-0 bg-emerald-400 rounded-3xl animate-ping opacity-20" />
                                  </div>
                                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Streak</p>
                                  <p className="text-4xl font-black serif tracking-tighter">{userProfile?.dailyChallengeStreak || 0} Dage</p>
                              </div>
                          </div>
                      </motion.div>
                  </section>

                  {/* Categories */}
                  <section className="space-y-12">
                      <div className="flex items-center justify-between pb-6 border-b border-amber-950/5">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-900 shadow-sm">
                                  <Layers className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="text-3xl font-black text-amber-950 serif tracking-tight">Vælg Disciplin</h3>
                                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">Træn din faglige intuition</p>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {Object.values(gameDataSets).map((game) => (
                              <GameSelectionCard 
                                  key={game.id}
                                  icon={game.icon}
                                  title={game.title}
                                  description={game.description}
                                  onSelect={() => onSelectGame(game.id as GameType)}
                                  level={userProfile?.mementoLevels?.[game.id as GameType] || 0}
                                  colorGradient={game.color}
                                  accentColor={game.accentColor}
                              />
                          ))}
                          <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center gap-6 opacity-40 group cursor-not-allowed"
                          >
                              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-slate-200">
                                  <PlusCircle className="w-8 h-8" />
                              </div>
                              <div>
                                  <h4 className="text-xl font-black text-slate-400 serif">Nye spil på vej...</h4>
                              </div>
                          </motion.div>
                      </div>
                  </section>
              </div>

              {/* Sidebar / Global Progress */}
              <aside className="lg:col-span-4 space-y-12">
                  <PremiumGlassCard className="p-10 border-amber-950/5 space-y-10">
                      <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-900/30">Rank Status</h3>
                          <Activity className="w-5 h-5 text-amber-400" />
                      </div>
                      
                      <div className="flex flex-col items-center gap-6">
                          <div className="relative w-40 h-40">
                              <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-50" />
                                  <circle 
                                      cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="12" 
                                      strokeDasharray={452.4} 
                                      strokeDashoffset={452.4 - (452.4 * (((userProfile?.cohéroPoints || 0) % 1000) / 1000))} 
                                      className="text-amber-500"
                                      strokeLinecap="round"
                                  />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-4xl font-black text-amber-950 serif">{Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}</span>
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rank</span>
                              </div>
                          </div>
                      </div>
                  </PremiumGlassCard>

                  <div className="p-10 bg-emerald-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                      <h3 className="text-2xl font-black serif mb-6 tracking-tight">Hvorfor lege?</h3>
                      <p className="text-emerald-100/60 leading-relaxed italic text-base mb-10">
                          "Leg og genkaldelse gør det lettere at huske paragraffer og teori, når du står i en svær sagssituation."
                      </p>
                      <div className="space-y-5">
                          {[
                              { label: "Stærkere intuition", icon: <Brain className="w-4 h-4" /> },
                              { label: "Mindre glemsel", icon: <Timer className="w-4 h-4" /> }
                          ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                                      {item.icon}
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest text-emerald-100">{item.label}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </aside>
          </div>
      </main>
    </div>
  );
};
