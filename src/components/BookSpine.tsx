
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Snowflake, Ghost } from 'lucide-react';

export const BookSpine: React.FC<{
  letter?: string;
  height: string;
  width: string;
  color: string;
  tilt?: string;
  decoration?: 'bands' | 'stripes' | 'plain' | 'gold' | 'ornament';
  index?: number;
  theme?: string;
  isGhost?: boolean;
}> = ({ letter, height, width, color, tilt = '', decoration = 'plain', index = 0, theme = 'default', isGhost = false }) => {
  const randomDelay = useMemo(() => Math.random() * 15, []);
  const randomRepeatDelay = useMemo(() => 10 + Math.random() * 20, []);

  const themeStyle = useMemo(() => {
    if (theme === 'christmas') {
        const colors = ['bg-rose-600', 'bg-emerald-600', 'bg-rose-500', 'bg-emerald-500', 'bg-slate-100'];
        return { 
            color: colors[index % colors.length], 
            textColor: 'text-white/90',
            decorationColor: 'bg-white/20' 
        };
    }
    if (theme === 'easter') {
        const colors = ['bg-yellow-200', 'bg-rose-200', 'bg-sky-200', 'bg-lime-200', 'bg-purple-200'];
        return { 
            color: colors[index % colors.length], 
            textColor: 'text-slate-700',
            decorationColor: 'bg-white/40' 
        };
    }
    if (theme === 'halloween') {
        const colors = ['bg-orange-600', 'bg-purple-900', 'bg-slate-900', 'bg-orange-700', 'bg-purple-800'];
        return { 
            color: colors[index % colors.length], 
            textColor: 'text-orange-200',
            decorationColor: 'bg-white/10' 
        };
    }
    if (isGhost) {
        return { 
            color: 'bg-transparent', 
            textColor: 'text-white', 
            decorationColor: 'bg-white/30' 
        };
    }
    return { color, textColor: 'text-black/80', decorationColor: 'bg-black/20' };
  }, [theme, color, index, isGhost]);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: randomRepeatDelay,
        ease: [0.34, 1.56, 0.64, 1], 
        delay: randomDelay
      }}
      whileHover={{ 
        y: theme === 'easter' ? -25 : theme === 'christmas' ? -15 : -12,
        x: theme === 'christmas' ? [0, -2, 2, -2, 2, 0] : theme === 'halloween' ? [0, -1, 1, -1, 1, 0] : 0,
        rotate: theme === 'christmas' ? [0, -3, 3, -3, 3, 0] : theme === 'halloween' ? [0, -2, 2, -2, 2, 0] : 0,
        scale: 1.05,
        transition: { type: "spring", stiffness: 400, damping: 10 } 
      }}
    className={`relative flex flex-col items-center justify-end ${width} ${height} ${themeStyle.color} 
    rounded-t-[2px] shadow-[inset_-1px_0_3px_rgba(0,0,0,0.1),2px_0_5px_rgba(0,0,0,0.05)] 
    transition-all duration-300 ease-out
    ${tilt} border ${isGhost ? 'border-white/60 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-black/20'} z-10 cursor-pointer group/book`}
  >
    {/* Theme Decorations on books */}
    {theme === 'christmas' && index % 4 === 0 && <Snowflake className="absolute -top-2 text-white/40 animate-pulse" size={10} />}
    {theme === 'halloween' && index % 5 === 0 && <Ghost className="absolute -top-3 text-white/20" size={12} />}
    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

    {/* Elegant Gold Glint Effect */}
    {decoration === 'gold' && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 + index }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
        />
      </div>
    )}

    {decoration === 'bands' && (
      <>
        <div className={`absolute top-3 w-full h-[1px] ${isGhost ? 'bg-white/40' : themeStyle.decorationColor}`}></div>
        <div className={`absolute top-4 w-full h-[1px] ${isGhost ? 'bg-white/20' : `${themeStyle.decorationColor} opacity-50`}`}></div>
        <div className={`absolute bottom-8 w-full h-[2px] ${isGhost ? 'bg-white/40' : `${themeStyle.decorationColor} opacity-50`}`}></div>
        <div className={`absolute bottom-10 w-full h-[1px] ${isGhost ? 'bg-white/20' : `${themeStyle.decorationColor} opacity-50`}`}></div>
      </>
    )}
    {decoration === 'gold' && (
      <>
        <div className={`absolute top-2 w-[80%] h-[1px] ${isGhost ? 'bg-white/30' : 'bg-black/10'}`}></div>
        <div className={`absolute top-4 w-[60%] h-[1px] ${isGhost ? 'bg-white/20' : 'bg-black/5'}`}></div>
        <div className={`absolute bottom-6 w-[80%] h-[1px] ${isGhost ? 'bg-white/30' : 'bg-black/10'}`}></div>
      </>
    )}
    {decoration === 'ornament' && (
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-6 border rounded-full ${isGhost ? 'border-white/30' : 'border-black/10'} opacity-20 group-hover/book:opacity-40 transition-opacity`}></div>
    )}
    {decoration === 'stripes' && (
      <div className={`absolute inset-y-4 left-1/2 -translate-x-1/2 w-[2px] ${isGhost ? 'bg-white/20 border-white/20' : 'bg-black/5 border-black/5'} border-x`}></div>
    )}

    {letter && (
      <motion.span 
        whileHover={{ scale: 1.1 }}
        className={`mb-3 text-[12px] font-black uppercase tracking-tighter select-none z-20 ${themeStyle.textColor}`}
      >
        {letter}
      </motion.span>
    )}
  </motion.div>
  );
};
