'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Quote } from 'lucide-react';
import { getReviewsAction } from '@/app/praktik-rating/actions';

export default function ReviewMarquee() {
    const [reviews, setReviews] = useState<any[]>([]);

    const FALLBACK_REVIEWS: any[] = [
        { id: 'f1', rating: 5, reviewText: 'Vejledningen var helt i top, og jeg fik lov til at prøve kræfter med rigtige opgaver fra dag ét.', userName: 'Mette S.', institutionName: 'Børne- og Ungdomsforvaltningen' },
        { id: 'f2', rating: 4, reviewText: 'Super godt arbejdsmiljø. Alle mine kolleger var meget hjælpsomme overfor mig som studerende.', userName: 'Thomas L.', institutionName: 'Regionshospitalet' },
        { id: 'f3', rating: 5, reviewText: 'Den bedste praktikplads jeg har haft. Der er virkelig styr på tingene her.', userName: 'Sara J.', institutionName: 'Kirkens Korshær' },
        { id: 'f4', rating: 4, reviewText: 'Lærerigt forløb med fokus på min faglige udvikling. Kan varmt anbefales til andre.', userName: 'Jonas K.', institutionName: 'Socialpsykiatrien' }
    ];

    useEffect(() => {
        getReviewsAction().then(res => {
            // Filter to only show reviews with text and rating >= 3
            let filtered = res.filter((r: any) => r.reviewText && r.rating >= 3).slice(0, 20);
            
            // If no data, use fallbacks
            if (filtered.length === 0) {
                filtered = FALLBACK_REVIEWS;
            }

            // Double the array for seamless scrolling
            setReviews([...filtered, ...filtered]);
        }).catch(() => {
            setReviews([...FALLBACK_REVIEWS, ...FALLBACK_REVIEWS]);
        });
    }, []);

    if (reviews.length === 0) return null;

    return (
        <div className="relative w-full bg-slate-900 overflow-hidden py-4 border-y border-white/5">
            <div className="flex whitespace-nowrap">
                <motion.div 
                    animate={{ x: [0, -100 * reviews.length / 2 + '%'] }}
                    transition={{ 
                        duration: 100, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="flex items-center gap-16 sm:gap-24 px-10"
                >
                    {reviews.map((review, idx) => (
                        <div key={`${review.id}-${idx}`} className="flex items-center gap-6 sm:gap-8 shrink-0 group">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                                   <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em]">Praktik-indblik</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/10 group-hover:border-amber-400/30 transition-colors">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{review.rating}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <Quote className="w-3.5 h-3.5 text-rose-500/30 rotate-180 shrink-0" />
                                <p className="text-xs sm:text-[15px] font-bold text-slate-300 group-hover:text-white transition-colors tracking-tight italic">
                                    "{review.reviewText.length > 100 ? review.reviewText.substring(0, 100) + '...' : review.reviewText}"
                                </p>
                            </div>

                            <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{review.userName || 'Anonym'}</span>
                                    <span className="text-[9px] font-bold text-rose-500/50 uppercase tracking-widest">{review.institutionName || 'Ukendt sted'}</span>
                                </div>
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
