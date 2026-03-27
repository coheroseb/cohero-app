'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Quote } from 'lucide-react';
import { getReviewsAction } from '@/app/praktik-rating/actions';

export default function ReviewMarquee() {
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        getReviewsAction().then(res => {
            // Filter to only show reviews with text and rating >= 4
            const filtered = res.filter((r: any) => r.reviewText && r.rating >= 4).slice(0, 10);
            // Double the array for seamless scrolling
            setReviews([...filtered, ...filtered]);
        });
    }, []);

    if (reviews.length === 0) return null;

    return (
        <div className="relative w-full bg-slate-900 overflow-hidden py-3 border-y border-white/5">
            <div className="flex whitespace-nowrap">
                <motion.div 
                    animate={{ x: [0, -100 * reviews.length / 2 + '%'] }}
                    transition={{ 
                        duration: 30, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="flex items-center gap-12 sm:gap-20 px-10"
                >
                    {reviews.map((review, idx) => (
                        <div key={`${review.id}-${idx}`} className="flex items-center gap-4 sm:gap-6 shrink-0 group">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 group-hover:border-amber-400/30 transition-colors">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{review.rating}/5</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Quote className="w-3 h-3 text-rose-500/40 rotate-180" />
                                <p className="text-xs sm:text-sm font-bold text-slate-400 group-hover:text-white transition-colors tracking-tight italic">
                                    "{review.reviewText.length > 80 ? review.reviewText.substring(0, 80) + '...' : review.reviewText}"
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300 transition-colors">
                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{review.userName || 'Anonym'}</span>
                                <span className="text-[9px] font-bold opacity-30">@{review.institutionName?.substring(0, 15)}...</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Fades on the sides for depth */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
        </div>
    );
}
