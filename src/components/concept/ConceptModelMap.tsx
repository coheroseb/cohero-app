'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    User, 
    Settings, 
    Scale, 
    Zap,
    BookOpen,
    Info,
    ArrowRight,
    HelpCircle
} from 'lucide-react';

interface Node {
    id: string;
    label: string;
    type: 'concept' | 'actor' | 'process' | 'law' | 'outcome';
    description?: string;
}

interface Edge {
    fromId: string;
    toId: string;
    label: string;
    description?: string;
}

interface ConceptModel {
    nodes: Node[];
    edges: Edge[];
}

export default function ConceptModelMap({ model }: { model: ConceptModel }) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

    // Enhanced Layout Calculation with Sorting for Flow
    const layoutNodes = useMemo(() => {
        // Sort nodes by type to create a logical "flow" in the circle
        const typeOrder: Record<string, number> = { 
            'actor': 0, 
            'process': 1, 
            'law': 2, 
            'concept': 3, 
            'outcome': 4 
        };
        const sorted = [...model.nodes].sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));

        const center = { x: 400, y: 300 };
        const radius = 220;
        
        return sorted.map((node, i) => {
            const angle = (i / sorted.length) * 2 * Math.PI - Math.PI / 2;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            
            return {
                ...node,
                x,
                y,
                angle
            };
        });
    }, [model]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'concept': return <Brain className="w-5 h-5" />;
            case 'actor': return <User className="w-5 h-5" />;
            case 'process': return <Settings className="w-5 h-5" />;
            case 'law': return <Scale className="w-5 h-5" />;
            case 'outcome': return <Zap className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'concept': return { bg: 'bg-amber-500', border: 'border-amber-600', shadow: 'shadow-amber-500/20', text: 'text-amber-500' };
            case 'actor': return { bg: 'bg-indigo-500', border: 'border-indigo-600', shadow: 'shadow-indigo-500/20', text: 'text-indigo-500' };
            case 'process': return { bg: 'bg-emerald-500', border: 'border-emerald-600', shadow: 'shadow-emerald-500/20', text: 'text-emerald-500' };
            case 'law': return { bg: 'bg-purple-500', border: 'border-purple-600', shadow: 'shadow-purple-500/20', text: 'text-purple-500' };
            case 'outcome': return { bg: 'bg-rose-500', border: 'border-rose-600', shadow: 'shadow-rose-500/20', text: 'text-rose-500' };
            default: return { bg: 'bg-slate-500', border: 'border-slate-600', shadow: 'shadow-slate-500/20', text: 'text-slate-500' };
        }
    };

    return (
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-white to-[#FDFCF8] rounded-[4rem] relative overflow-hidden border border-amber-100/50 shadow-2xl group/map">
            {/* Background elements for depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px]" />
            </div>

            <svg viewBox="0 0 800 600" className="w-full h-full relative z-10">
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="28" 
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" className="fill-amber-950/30" />
                    </marker>
                </defs>

                {/* Edges */}
                {model.edges.map((edge, i) => {
                    const from = layoutNodes.find(n => n.id === edge.fromId);
                    const to = layoutNodes.find(n => n.id === edge.toId);
                    if (!from || !to) return null;

                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; 
                    
                    const mx = (from.x + to.x) / 2;
                    const my = (from.y + to.y) / 2;
                    const cx = mx + (dy / dr) * 40; 
                    const cy = my - (dx / dr) * 40;

                    const isRelevant = hoveredNode === edge.fromId || hoveredNode === edge.toId || hoveredEdge === i;

                    return (
                        <g 
                            key={`edge-${i}`} 
                            onMouseEnter={() => setHoveredEdge(i)}
                            onMouseLeave={() => setHoveredEdge(null)}
                            className="cursor-pointer"
                        >
                            <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ 
                                    pathLength: 1, 
                                    opacity: hoveredNode ? (isRelevant ? 1 : 0.05) : 0.3,
                                    strokeWidth: isRelevant ? 4 : 2
                                }}
                                transition={{ delay: 0.5 + i * 0.05, duration: 1.5, ease: "easeInOut" }}
                                d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                                stroke="currentColor"
                                className={`transition-all duration-500 ${isRelevant ? 'text-amber-600' : 'text-amber-950/20'}`}
                                fill="transparent"
                                markerEnd="url(#arrowhead)"
                            />
                            
                            {/* Label box on edge curve midpoint */}
                            <foreignObject 
                                x={cx - 50} 
                                y={cy - 12} 
                                width="100" 
                                height="24"
                                className="pointer-events-none"
                            >
                                <motion.div 
                                    animate={{ 
                                        opacity: hoveredNode ? (isRelevant ? 1 : 0) : (hoveredEdge === i ? 1 : 0.4),
                                        scale: isRelevant ? 1.1 : 0.9,
                                        y: isRelevant ? 0 : 2
                                    }}
                                    className="flex items-center justify-center h-full transition-all duration-300"
                                >
                                    <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all duration-300 shadow-sm whitespace-nowrap ${isRelevant ? 'bg-amber-600 text-white border-amber-500' : 'bg-white/80 backdrop-blur-md text-amber-950/60 border-amber-100/50'}`}>
                                        {edge.label}
                                    </span>
                                </motion.div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* Nodes */}
                {layoutNodes.map((node, i) => {
                    const styles = getTypeStyles(node.type);
                    const isHovered = hoveredNode === node.id;
                    const isDimmed = hoveredNode !== null && !isHovered;

                    return (
                        <foreignObject 
                            key={node.id}
                            x={node.x - 70} 
                            y={node.y - 70} 
                            width="140" 
                            height="140"
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className="overflow-visible"
                        >
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                    scale: isHovered ? 1.05 : 1, 
                                    opacity: isDimmed ? 0.3 : 1,
                                    y: isHovered ? -5 : 0
                                }}
                                transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                                className="w-full h-full flex flex-col items-center justify-center gap-2 group/node cursor-pointer p-2"
                            >
                                {/* Glass Node Circle */}
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: isHovered ? 90 : 0 }}
                                        className={`absolute -inset-3 rounded-[2rem] bg-gradient-to-br ${styles.bg} opacity-0 group-hover/node:opacity-10 transition-opacity duration-500 blur-xl`}
                                    />
                                    <div className={`w-16 h-16 rounded-[1.75rem] bg-white border border-amber-100 shadow-xl flex items-center justify-center relative z-10 transition-all duration-300 group-hover/node:shadow-2xl group-hover/node:border-amber-200`}>
                                        <div className={`w-12 h-12 rounded-2xl ${styles.bg} flex items-center justify-center text-white shadow-lg ${styles.shadow}`}>
                                            {getIcon(node.type)}
                                        </div>
                                    </div>
                                    {/* Pulse effect for better visibility */}
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className={`absolute -inset-1 rounded-[1.75rem] border-2 border-dashed ${styles.text} opacity-20 pointer-events-none`}
                                    />
                                </div>

                                <div className="text-center px-2 relative z-20">
                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-amber-50 shadow-sm mt-1 mx-auto w-fit">
                                        <p className="text-[9px] font-black uppercase tracking-tight text-amber-950 leading-tight">
                                            {node.label}
                                        </p>
                                    </div>
                                    
                                    {/* Description Tooltip */}
                                    <AnimatePresence>
                                        {isHovered && node.description && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-amber-950 text-amber-50 p-4 rounded-3xl text-[10px] font-medium leading-relaxed z-50 shadow-2xl border border-white/10"
                                            >
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-950 rotate-45" />
                                                <p className="relative z-10">{node.description}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </foreignObject>
                    );
                })}
            </svg>

            {/* Header Legend */}
            <div className="absolute top-8 left-8 flex flex-col gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-100/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-900 border border-amber-100">
                        <Info className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-950">Konceptuel Struktur</p>
                        <p className="text-[8px] font-bold text-slate-400">Interaktiv visning af sammenhænge</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 max-w-[200px]">
                    {[
                        { type: 'concept', label: 'Begreb' },
                        { type: 'actor', label: 'Aktør' },
                        { type: 'process', label: 'Proces' },
                    ].map(legend => (
                        <div key={legend.type} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-100/30 text-[8px] font-black uppercase tracking-widest text-slate-400">
                            <div className={`w-1.5 h-1.5 rounded-full ${getTypeStyles(legend.type).bg}`} />
                            {legend.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Controls Hint */}
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-amber-950/20">
                    <div className="w-8 h-[1px] bg-amber-950/20" />
                    Cohero Visual Engine v1.0
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-950 text-amber-400 rounded-2xl text-[8px] font-black uppercase tracking-widest shadow-xl shadow-amber-950/20 animate-bounce-subtle pointer-events-auto">
                    <HelpCircle className="w-3 h-3" />
                    Hold musen over elementer
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
