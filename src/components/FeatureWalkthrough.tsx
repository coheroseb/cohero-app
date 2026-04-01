'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Scale, 
  Presentation, 
  MessageSquare, 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const BackgroundShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
        x: [0, 50, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/20 rounded-full blur-[100px]"
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.3, 1],
        rotate: [0, -120, 0],
        x: [0, -40, 0],
        y: [0, 60, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px]"
    />
    <motion.div 
      animate={{ 
        opacity: [0.1, 0.3, 0.1],
        y: [0, -100, 0]
      }}
      transition={{ duration: 15, repeat: Infinity }}
      className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-[80px]"
    />
  </div>
);

const InteractiveIllustration = ({ step }: { step: number }) => {
  switch (step) {
    case 0: // Welcome
      return (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-200"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-12 h-12 text-amber-500" />
          </motion.div>
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              animate={{ 
                x: [Math.cos(angle) * 60, Math.cos(angle) * 80, Math.cos(angle) * 60],
                y: [Math.sin(angle) * 60, Math.sin(angle) * 80, Math.sin(angle) * 60],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
              className="absolute w-3 h-3 bg-amber-400 rounded-full"
            />
          ))}
        </div>
      );
    case 1: // Law
      return (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Scale className="w-24 h-24 text-blue-500" />
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-4 -right-4"
            >
              <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />
            </motion.div>
          </motion.div>
        </div>
      );
    case 2: // Architect
      return (
        <div className="relative w-48 h-48 grid grid-cols-3 gap-2 p-8">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className={`rounded-lg ${i % 2 === 0 ? 'bg-purple-500' : 'bg-purple-200'} shadow-lg`}
            />
          ))}
        </div>
      );
    case 3: // Journal
      return (
        <div className="relative w-48 h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 bg-emerald-100 rounded mb-2"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
            className="h-2 bg-emerald-100 rounded mb-2"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "90%" }}
            transition={{ duration: 2, delay: 1, repeat: Infinity }}
            className="h-2 bg-emerald-100 rounded"
          />
          <motion.div 
            animate={{ x: [0, 40, 0], y: [0, 60, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-4 text-emerald-500"
          >
            <MessageSquare className="w-10 h-10" />
          </motion.div>
        </div>
      );
    case 4: // Opinion
      return (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="w-32 h-40 bg-white border-2 border-slate-100 rounded-lg shadow-inner relative overflow-hidden">
            <motion.div 
              animate={{ y: [-40, 160] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            />
            <div className="p-4 space-y-2">
              <div className="h-2 bg-slate-100 rounded w-full" />
              <div className="h-2 bg-slate-100 rounded w-3/4" />
              <div className="h-2 bg-slate-100 rounded w-full" />
            </div>
          </div>
          <ShieldCheck className="absolute w-12 h-12 text-rose-500 -bottom-2 -right-2 drop-shadow-lg" />
        </div>
      );
    case 5: // Ask Cohero
      return (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-amber-500"
          >
            <Heart className="w-24 h-24 fill-current" />
          </motion.div>
          <motion.div 
            animate={{ opacity: [0, 1, 0], scale: [1, 1.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute text-amber-300"
          >
            <Heart className="w-24 h-24 fill-current" />
          </motion.div>
        </div>
      );
    case 6: // Final
      return (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative"
          >
            <CheckCircle2 className="w-32 h-32 text-emerald-500" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-200 -z-10"
            />
          </motion.div>
        </div>
      );
    default:
      return null;
  }
};

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  accentColor: string;
}

interface FeatureWalkthroughProps {
  onComplete: () => void;
  isPage?: boolean;
  userProfile?: any;
}

const FeatureWalkthrough: React.FC<FeatureWalkthroughProps> = ({ onComplete, isPage = false, userProfile }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const firstName = userProfile?.displayName?.split(' ')[0] || 'studerende';

  const steps: Step[] = [
    {
      title: `Velkommen til Cohéro, ${firstName}!`,
      description: `Vi er utrolig glade for at have dig med på holdet${userProfile?.institution ? ` fra ${userProfile.institution}` : ''}. Din rejse mod at blive en dygtig socialrådgiver starter her.`,
      icon: <Sparkles className="w-12 h-12" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      accentColor: "bg-amber-500"
    },
    {
      title: "Faglige Opslagsværker",
      description: `Brug Begrebsguiden til at forstå komplekse teorier, og Lovportalen til at få AI-hjælp til at fortolke paragraffer i øjenhøjde. Altid lige ved hånden.`,
      icon: <BookOpen className="w-12 h-12" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      accentColor: "bg-blue-500"
    },
    {
      title: "Eksamens-Architect",
      description: "Planlæg dit semester og dine eksaminer med vores intelligente arkitekt. Få overblik over pensum og strukturér din læsning.",
      icon: <Presentation className="w-12 h-12" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      accentColor: "bg-purple-500"
    },
    {
      title: "Journal-Træner & Case-Analyse",
      description: "Få direkte sparring på dine journalnotater og analyser komplekse cases med AI-værktøjer, der er trænet i socialfaglig praksis.",
      icon: <MessageSquare className="w-12 h-12" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      accentColor: "bg-emerald-500"
    },
    {
      title: "Second Opinion",
      description: "Få en objektiv vurdering af dine opgaver. Vi analyserer din besvarelse op mod læringsmål, så du ved præcis, hvor du står.",
      icon: <ShieldCheck className="w-12 h-12" />,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      accentColor: "bg-rose-500"
    },
    {
      title: "Ask Cohéro",
      description: "Gør en reel forskel for borgere ved at tilbyde din hjælp som studerende. En unik mulighed for at prøve teorien i praksis.",
      icon: <Heart className="w-12 h-12" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      accentColor: "bg-amber-500"
    },
    {
      title: "Klar til start!",
      description: `Du har nu adgang til alle de værktøjer, du har brug for til ${userProfile?.semester || 'resten af studiet'}. Vi glæder os utrolig meget til at støtte dig gennem din uddannelse, ${firstName}!`,
      icon: <CheckCircle2 className="w-12 h-12" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      accentColor: "bg-emerald-500"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === steps.length - 2) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981']
        });
      }
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={isPage ? "min-h-screen relative flex items-center justify-center p-4 py-20 transition-colors duration-1000 overflow-hidden" : "fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden"}>
      {isPage && <BackgroundShapes />}
      
      {!isPage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
      )}

      {/* Dynamic Background Glow */}
      <AnimatePresence>
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${steps[currentStep].bgColor} blur-[120px] -z-10`}
        />
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative bg-white/80 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[550px] ${isPage ? 'border border-white/50' : ''}`}
      >
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
           {steps.map((_, i) => (
              <motion.div 
                key={i} 
                className="h-full flex-1"
                animate={{ 
                  backgroundColor: currentStep >= i ? 'rgba(15, 23, 42, 1)' : 'rgba(241, 245, 249, 1)' 
                }}
              />
           ))}
        </div>

        <div className="p-8 sm:p-12 flex-grow flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <button 
                onClick={prevStep} 
                className={`p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
             </button>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  Step {currentStep + 1} af {steps.length}
               </span>
             </div>
             <button 
                onClick={onComplete}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
             >
               Spring over
             </button>
          </div>

          <div className="flex-grow flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={`illu-${currentStep}`}
                  className="mb-8"
                >
                  <InteractiveIllustration step={currentStep} />
                </motion.div>
                
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-[-0.02em] serif italic">
                  {steps[currentStep].title}
                </h2>
                
                <p className="text-slate-500 text-lg leading-relaxed max-w-[360px] font-medium">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex flex-col gap-3">
             <button 
               onClick={nextStep}
               className="w-full flex items-center justify-center h-16 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
             >
               {currentStep === steps.length - 1 ? (
                 <>Kom i gang <CheckCircle2 className="w-5 h-5 ml-2" /></>
               ) : (
                 <>Næste <ArrowRight className="w-5 h-5 ml-2" /></>
               )}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureWalkthrough;
