'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, Trash2, Mail, Phone, MessageSquare, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export const GlassCard = memo(({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}>
        {children}
    </div>
));
GlassCard.displayName = 'GlassCard';

export const HistoryItem = memo(({ scenario, onClick, onDelete }: { scenario: any, onClick: () => void, onDelete: (id: string, e: React.MouseEvent) => void }) => (
    <motion.div 
        layout
        onClick={onClick}
        className="group relative p-5 mb-4 rounded-3xl border border-transparent hover:border-amber-100 hover:bg-white hover:shadow-xl hover:shadow-amber-950/5 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
    >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
                onClick={(e) => onDelete(scenario.id, e)}
                className="w-8 h-8 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 flex items-center justify-center text-amber-900 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                <Bookmark className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <h5 className="text-xs font-black text-amber-950 truncate mb-1 serif pr-8">{scenario.title || 'Uden titel'}</h5>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-amber-600 truncate max-w-[120px]">{scenario.topic || (scenario.sources ? 'Syntese-sag' : 'Ukendt')}</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-[9px] font-bold text-slate-400">{scenario.savedAt ? new Date(scenario.savedAt.toDate ? scenario.savedAt.toDate() : scenario.savedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Dato ukendt'}</span>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </div>
    </motion.div>
));
HistoryItem.displayName = 'HistoryItem';

const SourceIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
        case 'email': return <Mail className={className} />;
        case 'phone': return <Phone className={className} />;
        case 'sms': return <MessageSquare className={className} />;
        case 'note': return <FileText className={className} />;
        default: return <FileText className={className} />;
    }
};

export const SourceViewer = memo(({ source, isActive, onClick }: { source: any, isActive: boolean, onClick: () => void }) => {
    return (
        <motion.div 
            onClick={onClick}
            layout
            className={`cursor-pointer rounded-[2rem] p-6 transition-all duration-300 border-2 ${isActive ? 'bg-white border-amber-900 shadow-xl' : 'bg-white/50 border-transparent hover:bg-white hover:border-amber-100'}`}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-amber-900 text-amber-100' : 'bg-slate-100 text-slate-400'}`}>
                    <SourceIcon type={source.type} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-slate-400">{source.type}</p>
                    <h4 className="font-bold text-sm text-amber-950 truncate">{source.title}</h4>
                </div>
                <div className="text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
                    {source.date}
                </div>
            </div>
            
            {isActive && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-slate-100 mt-2"
                >
                    <div className="text-xs font-bold text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl inline-block border border-slate-100">
                        Afsender: <span className="text-amber-900">{source.sender}</span>
                    </div>
                    <div 
                        className={`text-sm leading-[2] ${source.type === 'sms' ? 'bg-amber-50 p-4 rounded-2xl rounded-tl-none inline-block max-w-[85%]' : 'text-slate-700 font-serif'}`}
                        dangerouslySetInnerHTML={{ __html: source.content }}
                    />
                </motion.div>
            )}
        </motion.div>
    );
});
SourceViewer.displayName = 'SourceViewer';

export const FeedbackItemCard = memo(({ item, index }: { item: any, index: number }) => {
    const isError = item.problemType === 'manglende_fakta' || item.problemType === 'juridisk_fejl' || item.problemType === 'subjektivt_sprog';
    const colorClass = isError ? 'rose' : 'amber';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-[2rem] p-6 border border-${colorClass}-100 shadow-sm`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 w-8 h-8 rounded-full bg-${colorClass}-50 text-${colorClass}-600 flex items-center justify-center shrink-0`}>
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest text-${colorClass}-600 bg-${colorClass}-50 px-3 py-1 rounded-full mb-3 inline-block`}>
                            {item.problemType.replace('_', ' ')}
                        </span>
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-rose-900 text-sm italic relative mt-2">
                            <span className="absolute top-2 right-4 text-[40px] text-rose-200/50 font-serif leading-none">"</span>
                            {item.originalQuote}
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1">Forslag</p>
                            <p className="text-sm text-emerald-800 leading-relaxed font-medium">{item.suggestedImprovement}</p>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2 border-t border-slate-100">
                        <strong className="text-slate-700">Begrundelse:</strong> {item.reasoning}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});
FeedbackItemCard.displayName = 'FeedbackItemCard';
