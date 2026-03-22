
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Pause, 
    RotateCcw, 
    Volume2, 
    VolumeX, 
    X, 
    ChevronRight, 
    ChevronLeft,
    Sparkles,
    Zap,
    Mic2
} from 'lucide-react';
import type { ConceptVideoScript } from '@/ai/flows/types';

const SoundVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
    return (
        <div className="flex items-center gap-1 h-12">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ 
                        height: isPlaying ? [10, 40, 15, 30, 10] : 4,
                    }}
                    transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: i * 0.05,
                        ease: "easeInOut"
                    }}
                    className="w-1 bg-amber-400 rounded-full"
                />
            ))}
        </div>
    );
};

export default function ConceptVideoPlayer({ script, onClose }: { script: ConceptVideoScript; onClose: () => void }) {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentScene = script.scenes[currentSceneIndex];

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const playScene = useCallback((index: number) => {
        stopPlayback();
        const scene = script.scenes[index];
        if (!scene) return;

        setCurrentSceneIndex(index);
        setProgress(0);

        // Progress bar simulation (as a fallback or in tandem)
        const duration = scene.durationSeconds * 1000;
        const start = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            if (elapsed >= duration) {
                clearInterval(timerRef.current!);
                if (index < script.scenes.length - 1) playScene(index + 1);
                else { setIsPlaying(false); setIsFinished(true); setProgress(100); }
            } else {
                setProgress((elapsed / duration) * 100);
            }
        }, 100);

        if (scene.audioDataUri) {
            const audio = new Audio(scene.audioDataUri);
            audio.muted = isMuted;
            audioRef.current = audio;

            audio.onloadeddata = () => {
                // Once audio is ready, clear the interval and use actual audio duration
                if (timerRef.current) clearInterval(timerRef.current);
                const actualDuration = audio.duration;
                
                timerRef.current = setInterval(() => {
                    if (!audioRef.current || audioRef.current.paused) return;
                    setProgress((audioRef.current.currentTime / actualDuration) * 100);
                }, 50);
                
                audio.play().catch(e => {
                    console.error("Audio playback error:", e);
                    // Trigger browser TTS as emergency fallback
                    speakFallback(scene.script);
                });
            };

            audio.onended = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                if (index < script.scenes.length - 1) {
                    playScene(index + 1);
                } else {
                    setIsPlaying(false);
                    setIsFinished(true);
                    setProgress(100);
                }
            };
        } else {
            // Fallback to browser TTS if no audioDataUri
            speakFallback(scene.script);
        }
    }, [script.scenes, isMuted, stopPlayback]);

    const speakFallback = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'da-DK';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };


    useEffect(() => {
        if (isPlaying) {
            playScene(currentSceneIndex);
        } else {
            if (audioRef.current) audioRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        return () => stopPlayback();
    }, [stopPlayback]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <motion.div 
                    animate={{ 
                        scale: isPlaying ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-tr from-amber-950 via-amber-900 to-black opacity-90"
                />
                
                {/* PROJECTED MEDIA */}
                <AnimatePresence mode="wait">
                    {(currentScene.videoUrl || currentScene.imageUrl) && (
                        <motion.div
                            key={currentScene.videoUrl || currentScene.imageUrl}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0"
                        >
                            {currentScene.videoUrl ? (
                                <video 
                                    src={currentScene.videoUrl} 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline
                                    className="w-full h-full object-cover mix-blend-overlay filter blur-sm" 
                                />
                            ) : (
                                <img 
                                    src={currentScene.imageUrl} 
                                    alt="" 
                                    className="w-full h-full object-cover mix-blend-overlay filter blur-sm" 
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>


                <div className="absolute inset-0 backdrop-blur-sm" />
            </div>

            {/* MAIN ILLUSTRATION (CENTERED) */}
            <div className="absolute inset-0 flex items-center justify-center z-10">

                 <AnimatePresence mode="wait">
                    {(currentScene.videoUrl || currentScene.imageUrl) && (
                        <motion.div
                            key={`main-${currentScene.videoUrl || currentScene.imageUrl}`}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 1.1 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="w-full max-w-lg aspect-square rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(251,191,36,0.15)] border-4 border-amber-400/20"
                        >
                            {currentScene.videoUrl ? (
                                <video 
                                    src={currentScene.videoUrl} 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <img 
                                    src={currentScene.imageUrl} 
                                    alt={currentScene.title} 
                                    className="w-full h-full object-cover" 
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>


            {/* KEYWORDS FLOATING (LIVELY EFFECT) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <AnimatePresence>
                    {currentScene.keywords?.map((word, i) => (
                        <motion.div
                            key={`${currentSceneIndex}-${word}`}
                            initial={{ opacity: 0, scale: 0.5, x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }}
                            animate={{ 
                                opacity: [0, 0.2, 0], 
                                scale: [0.8, 1.2, 0.8],
                                x: Math.random() * 400 - 200,
                                y: Math.random() * 400 - 200
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                            className="absolute left-1/2 top-1/2 text-5xl md:text-8xl font-black text-amber-400 capitalize whitespace-nowrap blur-[12px] select-none"
                        >
                            {word}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* MAIN CONTENT STAGE */}
            <div className="relative z-20 w-full h-full max-w-7xl px-8 flex flex-col items-center justify-end pb-48">

                
                {/* STAGE LIGHTING */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[150px] pointer-events-none" />

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentSceneIndex}
                        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="w-full text-center space-y-12"
                    >
                        {/* THE NARRATOR VISUAL */}
                        <div className="relative w-32 h-32 mx-auto">
                            <motion.div 
                                animate={{ scale: isPlaying ? [1, 1.15, 1] : 1 }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="absolute inset-0 bg-amber-400 rounded-full blur-2xl opacity-20"
                            />
                            <div className="relative w-full h-full bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
                                {isPlaying ? <SoundVisualizer isPlaying={isPlaying} /> : <Mic2 className="w-12 h-12 text-amber-400" />}
                            </div>
                        </div>

                        {/* SCRIPT TEXT (CINEMATIC SUBTITLES) */}
                        <div className="max-w-4xl mx-auto space-y-4">
                            <motion.span 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="text-amber-400 font-extrabold uppercase tracking-[0.4em] text-[10px] bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm shadow-xl"
                            >
                                {currentScene.title || "Begrebsforklaring"}
                            </motion.span>
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white px-8 py-6 leading-relaxed serif bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10">
                                {currentScene.script}
                            </h2>
                        </div>


                        {/* VISUAL CUE LABEL */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            className="text-xs font-bold text-white uppercase tracking-widest italic"
                        >
                            {currentScene.visualCue}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* CINEMATIC HUD & CONTROLS */}
            <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black to-transparent z-40">
                <div className="max-w-7xl mx-auto flex items-center gap-12">
                    
                    {/* PLAYBACK CONTROLS */}
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => {
                                if (isFinished) { setIsFinished(false); setCurrentSceneIndex(0); setIsPlaying(true); } 
                                else setIsPlaying(!isPlaying);
                            }}
                            className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] group"
                        >
                            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : isFinished ? <RotateCcw className="w-10 h-10" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                            
                            {/* RADIAL PROGRESS */}
                            <svg className="absolute inset-0 -rotate-90 w-full h-full p-1 opacity-20">
                                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="black" strokeWidth="2" strokeDasharray="100 100" />
                                <motion.circle 
                                    cx="50%" cy="50%" r="48%" 
                                    fill="none" 
                                    stroke="black" 
                                    strokeWidth="4" 
                                    strokeDasharray={`${progress} 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* METADATA */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <h3 className="text-2xl font-black text-white serif">{script.title}</h3>
                        </div>
                        <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">{script.concept} • Scene {currentSceneIndex + 1} af {script.scenes.length}</p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-6">
                        <div className="flex bg-white/5 rounded-2xl p-2 border border-white/10">
                            <button onClick={() => { if (currentSceneIndex > 0) playScene(currentSceneIndex - 1); }} disabled={currentSceneIndex === 0} className="p-3 text-white/50 hover:text-white disabled:opacity-10 transition-colors"><ChevronLeft className="w-6 h-6"/></button>
                            <button onClick={() => { if (currentSceneIndex < script.scenes.length - 1) playScene(currentSceneIndex + 1); }} disabled={currentSceneIndex === script.scenes.length - 1} className="p-3 text-white/50 hover:text-white disabled:opacity-10 transition-colors"><ChevronRight className="w-6 h-6"/></button>
                        </div>
                        <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all">
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                        <button onClick={onClose} className="p-4 bg-amber-400 text-amber-950 rounded-2xl hover:scale-105 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest px-8">Afslut</button>
                    </div>

                </div>
            </div>

            {/* SCANLINES OVERLAY */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            
        </motion.div>
    );
}
