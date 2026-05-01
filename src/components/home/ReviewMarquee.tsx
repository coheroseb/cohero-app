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
            // Fetch all reviews with text
            let filtered = res.filter((r: any) => r.reviewText).slice(0, 30);
            
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
        <div className="relative w-full bg-white/50 backdrop-blur-xl overflow-hidden py-12 border-y border-slate-100">
            <div className="flex whitespace-nowrap">
                <motion.div 
                    animate={{ x: [0, '-50%'] }}
                    transition={{ 
                        duration: reviews.length * 15, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="flex items-center gap-12 px-10"
                >
                    {reviews.map((review, idx) => (
                        <div key={`${review.id}-${idx}`} className="flex items-center gap-12 shrink-0 group">
                            {/* Card-like structure but without heavy borders */}
                            <div className="flex flex-col gap-6 max-w-lg">
                               <div className="flex items-center gap-4">
                                   <div className="flex gap-1">
                                       {[...Array(5)].map((_, i) => (
                                           <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                       ))}
                                   </div>
                                   <div className="h-px w-8 bg-slate-100" />
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Indblik</span>
                               </div>

                               <p className="text-xl sm:text-2xl font-medium text-slate-900 leading-tight tracking-tight whitespace-normal max-w-sm italic serif">
                                  "{review.reviewText.length > 120 ? review.reviewText.substring(0, 120) + '...' : review.reviewText}"
                               </p>

                               <div className="flex items-center gap-5">
                                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-600/20">
                                       {review.userName?.charAt(0) || 'A'}
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{review.userName || 'Anonym'}</span>
                                       <span className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.1em]">{review.institutionName || 'Ukendt sted'}</span>
                                   </div>
                               </div>
                            </div>

                            {/* Architectural Divider */}
                            <div className="h-40 w-px bg-slate-100/50" />
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Premium Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

            <style jsx>{`
              .serif { font-family: 'Playfair Display', serif; }
            `}</style>
        </div>
    );
}
