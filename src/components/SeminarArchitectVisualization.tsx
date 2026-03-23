'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Brain, BookOpen, CheckCircle2, Lightbulb, Zap } from 'lucide-react';

const SeminarArchitectVisualization = () => {
  const [cycle, setCycle] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle(prev => prev + 1);
    }, 12000); // 12 second cycle
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: 'chaos',
      title: 'Din udfordring',
      description: 'Spredte noter fra cases og juridiske kilder - uoverskueligt at organisere',
      icon: Brain,
      color: 'from-slate-500 to-slate-600',
      textColor: 'text-slate-700',
      bgColor: 'bg-slate-50'
    },
    {
      id: 'input',
      title: 'Upload & tag',
      description: 'Tilføj cases, love og kilder - systemet lærer dig at tænke struktureret',
      icon: BookOpen,
      color: 'from-amber-400 to-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'process',
      title: 'Arkitekten arbejder',
      description: 'AI analyserer og organiserer dine materialer efter faglige mønstre',
      icon: Zap,
      color: 'from-purple-400 to-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'output',
      title: 'Struktureret viden',
      description: 'Du får seminarer med klar logik, faglig feedback og øvelser',
      icon: CheckCircle2,
      color: 'from-emerald-400 to-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50'
    }
  ];

  const getStepDelay = (index: number) => {
    return cycle >= 0 ? index * 0.3 : 0;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Flow Visualization */}
      <div className="space-y-6 sm:space-y-8">
        {steps.map((step, index) => {
          const IsIcon = step.icon;
          const isActive = Math.floor((cycle / 4) % 4) === index;
          const isAnimating = cycle >= 0;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isAnimating ? 1 : 0, 
                x: 0,
                scale: isActive ? 1.05 : 1
              }}
              transition={{ 
                duration: 0.6, 
                delay: getStepDelay(index),
                ease: [0.21, 0.47, 0.32, 0.98]
              }}
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
              className="relative group cursor-pointer"
            >
              <div className={`${step.bgColor} border-2 border-transparent p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] transition-all duration-300 ${
                hoveredStep === index ? `border-current shadow-lg` : 'border-slate-200/50'
              }`}>
                {/* Icon + Title */}
                <div className="flex items-start gap-4 sm:gap-6 mb-3">
                  <motion.div
                    animate={{ 
                      scale: isActive ? [1, 1.1, 1] : 1,
                      rotate: isActive ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 text-white shadow-lg`}
                  >
                    <IsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className={`text-lg sm:text-xl font-bold ${step.textColor} leading-tight`}>
                      {step.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <motion.p
                  animate={{ opacity: hoveredStep === index ? 1 : 0.8 }}
                  className={`${step.textColor} text-[15px] sm:text-[16px] font-medium leading-relaxed ml-16 sm:ml-20`}
                >
                  {step.description}
                </motion.p>

                {/* Completion indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-t-[24px] sm:rounded-t-[32px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ y: isAnimating ? 0 : -10, opacity: isAnimating ? 0.4 : 0 }}
                  transition={{ delay: getStepDelay(index) + 0.3 }}
                  className="flex justify-center py-3 sm:py-4"
                >
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 rotate-90" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA message */}
      <motion.div
        key={`message-${cycle}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-8 sm:mt-12 p-6 sm:p-8 bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-[24px] text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <p className="text-[12px] sm:text-xs font-bold uppercase tracking-widest text-purple-600">
            Seminar-Arkitekten
          </p>
        </div>
        <p className="text-slate-700 font-semibold text-[16px] sm:text-lg leading-relaxed">
          Fra kaotiske noter til struktureret faglig udvikling
        </p>
      </motion.div>

      {/* Cycle indicator */}
      <div className="flex justify-center gap-2 mt-8 sm:mt-10">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: Math.floor((cycle / 4) % 4) === i ? 1.2 : 1,
              opacity: Math.floor((cycle / 4) % 4) === i ? 1 : 0.3
            }}
            className="w-2 h-2 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </div>
  );
};

export default SeminarArchitectVisualization;
