'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { 
    BarChart3, 
    ChevronRight, 
    X, 
    LayoutDashboard, 
    Bookmark, 
    TrendingUp, 
    Sparkles, 
    Menu,
    ArrowLeft,
    Search,
    Database,
    Fingerprint,
    Zap,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { fetchStarSubjectsAction } from '@/app/actions';

export function StarSidebar() {
    const { user, userProfile } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    
    const [subjects, setSubjects] = useState<any[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const activeSubjectId = params?.subjectId as string;
    const activeTableId = params?.tableId as string;

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const data = await fetchStarSubjectsAction();
                setSubjects(data || []);
            } catch (err) {
                console.error("Failed to load subjects for sidebar:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSubjects();
    }, []);

    const navItems = [
        { id: 'overview', label: 'Oversigt', icon: LayoutDashboard, href: '/star-indsigt' },
        { id: 'analysis', label: 'Mine Analyser', icon: Fingerprint, href: '/star-indsigt/analyses' },
        { id: 'training', label: 'Data Træning', icon: TrendingUp, href: '/star-indsigt/training' },
    ];

    const isActiveLink = (href: string) => {
        if (!pathname) return false;
        if (href === '/star-indsigt') return pathname === '/star-indsigt';
        return pathname.startsWith(href);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white/80 backdrop-blur-3xl lg:bg-transparent">
            {/* LOGO SECTION */}
            <div className="p-8 flex items-center gap-4 border-b border-amber-50/50 lg:border-none">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-1 group-hover:rotate-0 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-amber-950 serif tracking-tighter leading-none">STAR Indsigt</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/40 mt-1.5 flex items-center gap-2 italic font-sans">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                        Data & Tolkning
                    </p>
                </div>
            </div>

            {/* MAIN NAVIGATION */}
            <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar font-sans">
                {navItems.map((item) => {
                    const isActive = isActiveLink(item.href);
                    return (
                        <Link 
                            key={item.id} 
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all group/nav ${isActive ? 'bg-amber-950 text-white shadow-2xl shadow-amber-900/40 translate-x-1' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover/nav:scale-110'}`} /> 
                            {item.label}
                        </Link>
                    );
                })}

                <div className="pt-10 pb-4 px-6 font-sans">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-amber-100/60"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Emne-udforskning</h3>
                        <div className="h-px flex-1 bg-amber-100/60"></div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 animate-pulse">Henter emner...</div>
                ) : (
                    subjects.slice(0, 12).map((subject) => {
                        const sId = subject.SubjectID?.toString() || subject.subjectId?.toString();
                        const isActive = activeSubjectId === sId;
                        return (
                            <Link 
                                key={sId}
                                href={`/star-indsigt/subject/${sId}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`w-full text-left px-6 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-between group/nav ${isActive ? 'bg-amber-50 text-amber-950 border border-amber-200 shadow-sm' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950 hover:translate-x-1'}`}
                            >
                                <span className="line-clamp-2 pr-4 font-bold">{subject.SubjectName || subject.Name || subject.name || "Navn mangler"}</span>
                                <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${isActive ? 'opacity-100 translate-x-0 text-amber-950' : 'opacity-0 -translate-x-2 group-hover/nav:opacity-100 group-hover/nav:translate-x-0'}`} />
                            </Link>
                        );
                    })
                )}
            </nav>

            {/* USER PROFILE SECTION */}
            <div className="p-8 border-t border-amber-50/50">
                <div className="p-5 rounded-[2.5rem] bg-slate-50/50 border border-transparent hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-500 group/user font-sans">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 font-bold text-sm shadow-xl group-hover/user:rotate-3 transition-transform">
                            {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-black text-amber-950 truncate serif leading-tight">{userProfile?.displayName || (user?.email && user.email.split('@')[0])}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1 flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                {userProfile?.membership || 'Student'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* MOBILE TOP BAR */}
            <div className="lg:hidden h-20 bg-white border-b border-amber-100 px-6 flex items-center justify-between sticky top-0 z-40 font-sans">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-black text-amber-950 serif tracking-tighter">STAR Indsigt</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-950 flex items-center justify-center active:scale-95 transition-all shadow-sm border border-amber-100"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* MOBILE DRAWER */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-4 left-4 w-[85%] max-w-sm z-50 lg:hidden flex flex-col shadow-2xl rounded-[3rem] border border-white/20 overflow-hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* DESKTOP SIDEBAR */}
            <aside className="w-80 bg-white/60 backdrop-blur-3xl border-r border-amber-100 flex flex-col sticky top-0 h-screen z-30 hidden lg:flex">
                <SidebarContent />
            </aside>
        </>
    );
}
