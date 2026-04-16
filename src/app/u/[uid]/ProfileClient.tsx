'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Flame, 
    Trophy, 
    Zap, 
    ScrollText, 
    Brain, 
    Share2, 
    Linkedin, 
    Link as LinkIcon, 
    Check, 
    Award,
    Clock,
    Sparkles,
    Scale,
    Shield,
    ShieldCheck,
    Gavel,
    GraduationCap,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import DigitalCertificate from '@/components/DigitalCertificate';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfileClientProps {
  initialData: {
    profile: any;
    activities: any[];
    quizResults: any[];
  };
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const { profile, activities, quizResults } = initialData;
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast({
      title: "Link kopieret!",
      description: "Du kan nu dele din profil med andre.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${profile.username}s Professionelle Profil - Cohéro`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40">
      
      {/* Mini Header / Logo */}
      <div className="flex justify-center mb-16">
         <Link href="/">
            <img src="https://cohero.dk/main_logo.png" alt="Cohéro Logo" className="h-10 w-auto" />
         </Link>
      </div>

      {/* Header / Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-24"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-900 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-200/50">
          <ShieldCheck className="w-4 h-4" /> Verificeret Cohéro Profil
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black text-slate-950 serif mb-6 tracking-tight">
          {profile.username}
        </motion.h1>
        
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 text-slate-500 font-bold text-lg mb-10">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white shadow-sm border border-slate-100 rounded-2xl">
            <Brain className="w-5 h-5 text-indigo-500" />
            {profile.profession}
          </div>
          {profile.institution && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white shadow-sm border border-slate-100 rounded-2xl">
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              {profile.institution}
            </div>
          )}
          {profile.semester && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white shadow-sm border border-slate-100 rounded-2xl">
              <Clock className="w-5 h-5 text-amber-500" />
              {profile.semester}. semester
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
          <Button 
            onClick={shareToLinkedIn}
            className="bg-[#0077B5] hover:bg-[#00669c] text-white px-8 py-6 h-auto rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex items-center gap-3"
          >
            <Linkedin className="w-5 h-5" /> Del på LinkedIn
          </Button>
          <Button 
            variant="outline"
            onClick={copyToClipboard}
            className="bg-white border-slate-200 text-slate-600 px-8 py-6 h-auto rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-lg hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-3"
          >
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5 shadow-inner" />} {isCopied ? 'Kopieret' : 'Kopier Link'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats and Streak Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {/* Streak Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[40px] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-700">
            <Flame className="w-32 h-32" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Aktivitets-Streak</p>
          <h3 className="text-6xl font-black mb-4">{profile.dailyChallengeStreak} <span className="text-2xl font-medium opacity-70">dage</span></h3>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full w-fit border border-white/20">
             <Trophy className="w-4 h-4" />
             <span className="text-xs font-bold font-mono">Personal Best: {profile.highestStreak}</span>
          </div>
        </motion.div>

        {/* Progression Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Faglig Progression</p>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Brain className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-slate-900">Teoretisk Overblik</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">LVL {profile.mementoLevels?.theorist || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                        <ScrollText className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-slate-900">Juridisk Præcision</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">LVL {profile.mementoLevels?.paragraph || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Zap className="w-5 h-5" />
                     </div>
                     <span className="text-sm font-bold text-slate-900">Metodisk Skøn</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">LVL {profile.mementoLevels?.method || 0}</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Law Portal Progression */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
              <Scale className="w-24 h-24" />
           </div>
           
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lov-Stien Progression</p>
                 <p className="text-xl font-bold text-slate-900 serif">Juridisk Træningsforløb</p>
              </div>
              <div className="px-4 py-1.5 bg-rose-50 rounded-full border border-rose-100">
                 <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    {(profile.mementoLevels?.paragraph || 0) >= 10 ? 'Juridisk Ekspert' : (profile.mementoLevels?.paragraph || 0) >= 5 ? 'Rutineret' : 'Juridisk Aspirant'}
                 </span>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                 <span>Fremgang mod Mester-niveau</span>
                 <span>{Math.min(100, ((profile.mementoLevels?.paragraph || 0) / 10) * 100)}%</span>
              </div>
              <div className="h-4 bg-slate-50 rounded-full border border-slate-100 overflow-hidden p-1">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((profile.mementoLevels?.paragraph || 0) / 10) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full shadow-lg shadow-rose-500/20"
                 />
              </div>
              <div className="grid grid-cols-3 pt-2">
                 <div className="flex flex-col items-start gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(profile.mementoLevels?.paragraph || 0) >= 1 ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                       <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Intro</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(profile.mementoLevels?.paragraph || 0) >= 5 ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                       <Gavel className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Rutineret</span>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(profile.mementoLevels?.paragraph || 0) >= 10 ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                       <Trophy className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Mester</span>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Faglige Milepæle / Quiz Historik */}
        <section className="col-span-full mt-12 mb-16">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Træningshistorik</h3>
                    <h2 className="text-3xl font-black text-slate-950 serif">Lovmæssige Milepæle</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizResults.length > 0 ? quizResults.map((quiz, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        key={quiz.id}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-110 transition-transform">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Score</p>
                                <p className="font-mono font-black text-slate-900">{quiz.score}/{quiz.totalQuestions}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-slate-900 line-clamp-1">{quiz.lawTitle}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{quiz.topic || 'Generel Træning'}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black">
                                    <span className="text-slate-400">PRÆCISION</span>
                                    <span className={quiz.score / quiz.totalQuestions >= 0.8 ? 'text-emerald-500' : 'text-amber-500'}>
                                        {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(quiz.score / quiz.totalQuestions) * 100}%` }}
                                        className={`h-full rounded-full ${quiz.score / quiz.totalQuestions >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-300">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[9px] font-bold uppercase">{new Date(quiz.createdAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <ShieldCheck className={`w-4 h-4 ${quiz.score / quiz.totalQuestions >= 0.8 ? 'text-emerald-500' : 'text-slate-100'}`} />
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-full bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 p-12 flex flex-col items-center justify-center gap-4 text-center">
                         <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-200">
                            <Scale className="w-8 h-8" />
                         </div>
                         <div className="max-w-xs">
                            <p className="font-bold text-slate-900">Ingen quiz-historik endnu</p>
                            <p className="text-xs font-medium text-slate-400">Brugeren har ikke gennemført lov-prøver på platformen for nylig.</p>
                         </div>
                    </div>
                )}
            </div>
        </section>

        {/* Activity Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-950/20"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Seneste Aktivitet</p>
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((act, i) => (
                <div key={i} className="flex gap-4 group cursor-default">
                   <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-150 transition-transform" />
                   <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{act.actionText}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {new Date(act.createdAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                      </p>
                   </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
                   <Sparkles className="w-8 h-8 text-white/10" />
                   <p className="text-xs font-medium text-white/40 italic">Ingen nyere aktivitet registreret...</p>
                </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Digital Certificate Section */}
      <section className="mb-24">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest w-fit">
                    Udmærkelse
                </div>
                <h2 className="text-4xl font-black text-slate-950 serif">Digitalt Certifikat</h2>
                <p className="text-slate-500 font-medium">Et bevis på din faglige aktivitet og metodiske træning på Cohéro.</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Medlemsskab</p>
                    <p className="text-sm font-bold text-slate-900">{profile.membership}</p>
                </div>
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
                    <Award className="w-6 h-6" />
                </div>
            </div>
        </div>

        <DigitalCertificate 
            username={profile.username}
            profession={profile.profession}
            institution={profile.institution}
            completedAt={profile.createdAt}
            uid={profile.uid}
        />
        
        <div className="mt-12 p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 flex flex-col md:flex-row items-center gap-8 group">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-black text-slate-950 serif mb-1">Klar til dit næste skidt?</h4>
                <p className="text-slate-500 font-medium italic">Vis dine fremtidige arbejdsgivere din dedikation til faglig udvikling.</p>
            </div>
            <Button 
                onClick={shareToLinkedIn}
                className="bg-white hover:bg-white text-blue-600 border-2 border-blue-600/10 px-8 py-6 h-auto rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/5 active:scale-95 transition-all group-hover:border-blue-600/30"
            >
                Add to profile <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </section>

      {/* Footer Branding */}
      <div className="flex flex-col items-center justify-center gap-6 pt-24 border-t border-slate-100">
         <img src="https://cohero.dk/main_logo.png" alt="Cohéro Logo" className="h-8 w-auto grayscale opacity-20" />
         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Det faglige kompas for fremtidens velfærd</p>
      </div>

    </div>
  );
}
