'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ChevronRight, Trash2, Mail, Phone, MessageSquare, FileText, AlertTriangle, CheckCircle, Lightbulb, User, Calendar, Hash } from 'lucide-react';

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
        case 'report': return <FileText className={className} />;
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
                    {source.type === 'email' ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Fra: <span className="text-slate-900 lowercase font-medium">{source.sender}</span></p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Emne: <span className="text-slate-900 lowercase font-medium">{source.title}</span></p>
                            </div>
                            <div className="text-sm leading-relaxed text-slate-700 font-serif px-1" dangerouslySetInnerHTML={{ __html: source.content }} />
                        </div>
                    ) : source.type === 'sms' ? (
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[9px] font-bold text-slate-400 ml-4 mb-1">{source.sender}</span>
                            <div className="bg-amber-50 p-4 rounded-2xl rounded-tl-none inline-block max-w-[90%] border border-amber-100/50 text-sm leading-relaxed text-amber-950 shadow-sm" dangerouslySetInnerHTML={{ __html: source.content }} />
                        </div>
                    ) : source.type === 'report' ? (
                        <div className="bg-white border border-slate-100 p-8 rounded-xl shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200" />
                            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-4">
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">Officiel Rapport</h5>
                                    <p className="text-xs font-bold text-slate-900">{source.sender}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-medium">Ref: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="text-sm leading-[1.8] text-slate-800 font-serif prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: source.content }} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl inline-block border border-slate-100">
                                Afsender: <span className="text-amber-900">{source.sender}</span>
                            </div>
                            <div 
                                className="text-sm leading-[2] text-slate-700 font-serif"
                                dangerouslySetInnerHTML={{ __html: source.content }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
});
SourceViewer.displayName = 'SourceViewer';

export const ScoreCard = memo(({ label, score, icon: Icon, colorClass = "indigo" }: { label: string, score: number, icon: any, colorClass?: string }) => {
    const bgClasses: Record<string, string> = {
        indigo: 'bg-indigo-50',
        emerald: 'bg-emerald-50',
        blue: 'bg-blue-50',
        orange: 'bg-orange-50'
    };
    const textClasses: Record<string, string> = {
        indigo: 'text-indigo-500',
        emerald: 'text-emerald-500',
        blue: 'text-blue-500',
        orange: 'text-orange-500'
    };
    const iconClasses: Record<string, string> = {
        indigo: 'text-indigo-400',
        emerald: 'text-emerald-400',
        blue: 'text-blue-400',
        orange: 'text-orange-400'
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full ${bgClasses[colorClass] || 'bg-slate-50'} flex items-center justify-center ${textClasses[colorClass] || 'text-slate-500'} font-black text-2xl border-4 border-white shadow-lg`}>
                {score}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconClasses[colorClass] || 'text-slate-400'}`} />
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Vurdering</p>
                </div>
            </div>
        </div>
    );
});
ScoreCard.displayName = 'ScoreCard';

export const FeedbackItemCard = memo(({ item, index }: { item: any, index: number }) => {
    const isError = ['manglende_fakta', 'juridisk_fejl', 'subjektivt_sprog', 'modstridende_info'].includes(item.problemType);
    
    // Explicit color mapping for Tailwind
    const styles = isError ? {
        border: 'border-rose-100',
        iconBg: 'bg-rose-50',
        iconText: 'text-rose-600',
        tagBg: 'bg-rose-50',
        tagText: 'text-rose-600'
    } : {
        border: 'border-amber-100',
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        tagBg: 'bg-amber-50',
        tagText: 'text-amber-600'
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-[2rem] p-6 border ${styles.border} shadow-sm`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 w-8 h-8 rounded-full ${styles.iconBg} ${styles.iconText} flex items-center justify-center shrink-0`}>
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${styles.tagText} ${styles.tagBg} px-3 py-1 rounded-full mb-3 inline-block`}>
                            {item.problemType?.replace('_', ' ')}
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
                    
                    {item.teachingPoint && (
                        <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Læringspunkt</p>
                                <p className="text-sm text-blue-800 leading-relaxed font-medium italic">{item.teachingPoint}</p>
                            </div>
                        </div>
                    )}
                    
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2 border-t border-slate-100">
                        <strong className="text-slate-700">Begrundelse:</strong> {item.reasoning}
                    </p>
                </div>
            </div>
        </motion.div>
    );
});
FeedbackItemCard.displayName = 'FeedbackItemCard';

export const HighlightableText = memo(({ text, improvements }: { text: string, improvements: any[] }) => {
    if (!improvements || improvements.length === 0) return <div className="text-amber-950 font-medium text-lg leading-[2] whitespace-pre-wrap">{text}</div>;

    // Sort improvements by length of originalQuote descending to avoid partial matches interfering? 
    // Actually, we just need to find them and wrap them. 
    // This is a naive implementation that works for exact matches.
    let highlightedText = text;
    
    // We sort by length to avoid issues where one quote is a substring of another
    const sortedImprovements = [...improvements].sort((a,b) => b.originalQuote.length - a.originalQuote.length);

    // To avoid replacing the same text multiple times or replacing inside a tag, 
    // we use a marker approach.
    const parts: { text: string, isHighlighted: boolean, type?: string }[] = [{ text, isHighlighted: false }];

    sortedImprovements.forEach((imp) => {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].isHighlighted) continue;
            
            const index = parts[i].text.indexOf(imp.originalQuote);
            if (index !== -1) {
                const before = parts[i].text.substring(0, index);
                const match = parts[i].text.substring(index, index + imp.originalQuote.length);
                const after = parts[i].text.substring(index + imp.originalQuote.length);
                
                const newParts: { text: string, isHighlighted: boolean, type?: string }[] = [];
                if (before) newParts.push({ text: before, isHighlighted: false });
                newParts.push({ text: match, isHighlighted: true, type: imp.problemType });
                if (after) newParts.push({ text: after, isHighlighted: false });
                
                parts.splice(i, 1, ...newParts);
                break; // Move to next improvement
            }
        }
    });

    return (
        <div className="text-amber-950 font-medium text-lg leading-[2] whitespace-pre-wrap">
            {parts.map((part, i) => (
                part.isHighlighted ? (
                    <span 
                        key={i} 
                        className={`px-1 py-0.5 rounded cursor-help transition-colors ${
                            part.type === 'subjektivt_sprog' ? 'bg-rose-100 hover:bg-rose-200 decoration-rose-400' :
                            part.type === 'manglende_fakta' ? 'bg-orange-100 hover:bg-orange-200 decoration-orange-400' :
                            part.type === 'modstridende_info' ? 'bg-purple-100 hover:bg-purple-200 decoration-purple-400' :
                            'bg-amber-100 hover:bg-amber-200 decoration-amber-400'
                        } border-b-2 font-bold`}
                        title={part.type?.replace('_', ' ')}
                    >
                        {part.text}
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            ))}
        </div>
    );
});
HighlightableText.displayName = 'HighlightableText';
