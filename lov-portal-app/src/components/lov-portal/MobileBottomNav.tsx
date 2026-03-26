'use client';

import React from 'react';
import { 
    Search, 
    BookOpen, 
    Bookmark, 
    TrendingUp, 
    LayoutDashboard, 
    Zap,
    Scale,
    Library,
    Gavel
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
    viewMode: 'laws' | 'decisions' | 'saved' | 'training' | 'reforms';
    onTabChange: (mode: 'laws' | 'decisions' | 'saved' | 'training' | 'reforms') => void;
    onSearchToggle?: () => void;
    activeLawId?: string | null;
    activeReferenceId?: string | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
    viewMode, 
    onTabChange, 
    onSearchToggle,
    activeLawId, 
    activeReferenceId 
}) => {
    const isInsideLaw = !!(activeLawId || activeReferenceId);

    const tabs = [
        { id: 'laws', label: 'Lovportal', icon: Library },
        { id: 'reforms', label: 'Reformer', icon: Gavel },
        { id: 'saved', label: 'Gemte', icon: Bookmark },
    ] as const;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 lg:hidden pointer-events-none">
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="max-w-md mx-auto bg-amber-950/95 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-2 flex items-center justify-between pointer-events-auto"
            >
                {tabs.map((tab) => {
                    const isActive = viewMode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`relative flex flex-col items-center gap-1 py-3 px-6 rounded-3xl transition-all active:scale-95 ${isActive ? 'text-amber-400' : 'text-amber-100/40'}`}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-0 bg-white/5 rounded-3xl -z-10 border border-white/5 shadow-inner"
                                />
                            )}
                            <tab.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}

                {/* Search Toggle */}
                <button 
                    onClick={() => {
                        if (onSearchToggle) onSearchToggle();
                    }}
                    className="w-14 h-14 bg-amber-400 rounded-3xl flex items-center justify-center text-amber-950 shadow-xl shadow-amber-400/20 active:scale-90 transition-transform ml-2 shrink-0"
                >
                    <Search className="w-6 h-6 stroke-[3px]" />
                </button>
            </motion.div>
        </div>
    );
};
