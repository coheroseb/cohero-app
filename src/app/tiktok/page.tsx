'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/app/provider';

function TikTokCard({ video, index }: { video: any; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col h-full"
    >
      <div className="aspect-[9/16] w-full bg-slate-50 relative overflow-hidden flex-shrink-0">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${video.videoId}`}
          className="w-full h-full border-none"
          allowFullScreen
          scrolling="no"
          allow="encrypted-media;"
        />
      </div>
      <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between mt-auto">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 leading-none">@{video.handle}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{video.title || 'Se video'}</p>
        </div>
        <a 
          href={`https://www.tiktok.com/@${video.handle}/video/${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100 flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

export default function TikTokArchivePage() {
    const { user, userProfile, handleLogout, openAuthPage } = useApp();
    const firestore = useFirestore();
    const videosQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'tiktokVideos'), orderBy('createdAt', 'desc')) : null
    ), [firestore]);
    
    const { data: videos, isLoading } = useCollection<any>(videosQuery);

    return (
        <div className="min-h-screen bg-[#FDFBF7] selection:bg-amber-200">
            <Navbar 
                user={user} 
                userProfile={userProfile} 
                onLogout={handleLogout} 
                onAuth={openAuthPage} 
            />
            
            <header className="pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-8">
                        <ArrowLeft className="w-3.5 h-3.5" /> Tilbage til forsiden
                    </Link>
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9]">
                            TikTok <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500 italic">Arkiv.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium mt-8 leading-relaxed">
                            Vi dokumenterer rejsen ufiltreret. Her finder du alle vores videoer om studielivet, sparrings-tips og behind-the-scenes fra Cohéro.
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-40">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[9/16] bg-slate-100/50 animate-pulse rounded-[2.5rem] border border-slate-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {videos?.map((video: any, idx: number) => (
                            <TikTokCard key={video.id} video={video} index={idx} />
                        ))}
                    </div>
                )}

                {!isLoading && videos?.length === 0 && (
                    <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[3.5rem] bg-white/50">
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Arkivet er tomt – Vi uploader snart nyt indhold!</p>
                    </div>
                )}
            </main>

            {/* Subtle floating background elements */}
            <div className="fixed top-1/4 right-0 w-96 h-96 bg-amber-100/20 blur-[120px] rounded-full -z-10" />
            <div className="fixed bottom-1/4 left-0 w-96 h-96 bg-rose-100/20 blur-[120px] rounded-full -z-10" />
        </div>
    );
}
