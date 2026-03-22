'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Edit2, Trash2, Info, Target, ScrollText, Link as LinkIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { PortfolioEntry, Evidence } from './types';

interface PortfolioCardProps {
    entry: PortfolioEntry;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    evidence: Evidence[] | null;
    locale: string;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ entry, onEdit, onDelete, onMoveUp, onMoveDown, evidence, locale }) => {
    const linkedCount = entry.linkedEvidenceIds?.length || 0;
    const updatedAt = entry.updatedAt?.toDate?.() || new Date();

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white p-8 sm:p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                <BookOpen className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            entry.status === 'final' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            entry.status === 'review' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                            {entry.status.toUpperCase()}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {updatedAt.toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {onMoveUp && <button onClick={onMoveUp} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-95"><ArrowUp className="w-4 h-4" /></button>}
                        {onMoveDown && <button onClick={onMoveDown} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-95"><ArrowDown className="w-4 h-4" /></button>}
                        <button onClick={onEdit} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={onDelete} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="space-y-4 mb-10">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase">{entry.title}</h4>
                    
                    {entry.assignment && (
                        <div className="bg-slate-50/80 p-6 rounded-[24px] border border-slate-100/50 text-[12px] text-slate-500 font-medium relative overflow-hidden group/guide">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                                <ScrollText className="w-12 h-12" />
                            </div>
                            <span className="font-black text-slate-400 uppercase tracking-widest text-[9px] block mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> {locale === 'da' ? 'VEJLEDNING' : 'GUIDELINE'}
                            </span>
                            <p className="leading-relaxed italic">{entry.assignment}</p>
                            
                            {entry.characterLimit && (
                                <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                        <Target className="w-3.5 h-3.5" /> {locale === 'da' ? 'KRAV:' : 'LIMIT:'} {entry.characterLimit}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                        {entry.content.replace(/<[^>]*>/g, '').length} {locale === 'da' ? 'TEGN' : 'CHARS'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!entry.characterLimit && (
                         <div className="flex justify-end mb-2">
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                                {entry.content.replace(/<[^>]*>/g, '').length} {locale === 'da' ? 'tegn skrevet' : 'chars written'}
                            </div>
                         </div>
                    )}

                    <div className="text-[14px] text-slate-500 font-medium leading-[1.8] line-clamp-4 prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-[11px] font-black shadow-lg">{entry.addedByName.charAt(0).toUpperCase()}</div>
                        <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{entry.addedByName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{locale === 'da' ? 'Forfatter' : 'Author'}</p>
                        </div>
                    </div>
                    
                    {linkedCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                            <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{linkedCount} {locale === 'da' ? 'KILDER' : 'SOURCES'}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
