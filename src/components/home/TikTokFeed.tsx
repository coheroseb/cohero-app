'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react';

interface TikTokFeedProps {
  videoId?: string;
  handle?: string;
}

export default function TikTokFeed({ 
  videoId = "7621529596390837526", 
  handle = "cohro" 
}: TikTokFeedProps) {
  
  useEffect(() => {
    // Load TikTok embed script
    const script = document.createElement('script');
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [videoId]);

  return (
    <div className="w-full max-w-[325px] mx-auto group">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-amber-100/50 group-hover:shadow-amber-500/10 transition-all duration-500"
      >
        {/* Mobile-style Frame */}
        <div className="aspect-[9/16] w-full bg-slate-100 relative overflow-hidden">
           <blockquote 
            className="tiktok-embed w-full h-full" 
            cite={`https://www.tiktok.com/@${handle}/video/${videoId}`} 
            data-video-id={videoId}
            style={{ maxWidth: '605px', minWidth: '325px', height: '100%' }}
          >
            <section className="flex items-center justify-center h-full">
              <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
                <svg className="w-12 h-12 opacity-20 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.37a7.25 7.25 0 01-1.89-1.63v6.3c.01 2.45-1.24 4.88-3.39 6.07-2.3 1.28-5.32 1.08-7.39-.53-2.07-1.61-2.94-4.52-2.09-7.01.85-2.49 3.52-4.13 6.13-3.83 1.05.12 2.05.51 2.92 1.13V.02z"/>
                </svg>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Henter seneste video...</p>
              </div>
            </section>
          </blockquote>
        </div>

        {/* Action Overlay (Subtle) */}
        <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white ring-2 ring-white shadow-md">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.37a7.25 7.25 0 01-1.89-1.63v6.3c.01 2.45-1.24 4.88-3.39 6.07-2.3 1.28-5.32 1.08-7.39-.53-2.07-1.61-2.94-4.52-2.09-7.01.85-2.49 3.52-4.13 6.13-3.83 1.05.12 2.05.51 2.92 1.13V.02z"/>
                    </svg>
                </div>
                <div>
                   <p className="text-xs font-black text-slate-900 leading-none">@{handle}</p>
                   <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-1">Følg med her</p>
                </div>
            </div>
            <a 
                href={`https://www.tiktok.com/@${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all group-hover:scale-110 active:scale-95 shadow-sm border border-slate-100"
            >
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
      </motion.div>
    </div>
  );
}
