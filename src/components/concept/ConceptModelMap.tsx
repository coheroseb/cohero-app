'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Brain, 
    User, 
    Settings, 
    Scale, 
    Zap,
    ChevronRight,
    ArrowRight
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
    // Basic Circle Layout Calculation
    const layoutNodes = useMemo(() => {
        const center = { x: 400, y: 300 };
        const radius = 220;
        
        return model.nodes.map((node, i) => {
            const angle = (i / model.nodes.length) * 2 * Math.PI - Math.PI / 2;
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
            default: return <Brain className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'concept': return 'bg-amber-500 border-amber-600';
            case 'actor': return 'bg-indigo-500 border-indigo-600';
            case 'process': return 'bg-emerald-500 border-emerald-600';
            case 'law': return 'bg-purple-500 border-purple-600';
            case 'outcome': return 'bg-rose-500 border-rose-600';
            default: return 'bg-slate-500 border-slate-600';
        }
    };

    return (
        <div className="w-full aspect-[4/3] bg-amber-50/20 rounded-[3rem] relative overflow-hidden border border-amber-100 shadow-inner group">
            <svg viewBox="0 0 800 600" className="w-full h-full">
                {/* Edges */}
                {model.edges.map((edge, i) => {
                    const from = layoutNodes.find(n => n.id === edge.fromId);
                    const to = layoutNodes.find(n => n.id === edge.toId);
                    if (!from || !to) return null;

                    return (
                        <g key={`edge-${i}`}>
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke="currentColor"
                                className="text-amber-950/20"
                                strokeWidth="2"
                                strokeDasharray="6 4"
                            />
                            {/* Label box on edge */}
                            <foreignObject 
                                x={(from.x + to.x) / 2 - 50} 
                                y={(from.y + to.y) / 2 - 15} 
                                width="100" 
                                height="30"
                            >
                                <div className="flex items-center justify-center h-full">
                                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-amber-950 border border-amber-100 shadow-sm">
                                        {edge.label}
                                    </span>
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* Nodes */}
                {layoutNodes.map((node, i) => (
                    <foreignObject 
                        key={node.id}
                        x={node.x - 70} 
                        y={node.y - 70} 
                        width="140" 
                        height="140"
                    >
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', damping: 12 }}
                            className="w-full h-full flex flex-col items-center justify-center gap-3 group/node"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover/node:scale-110 border-b-4 ${getTypeColor(node.type)}`}>
                                {getIcon(node.type)}
                            </div>
                            <div className="text-center px-4">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-amber-950 leading-tight">
                                    {node.label}
                                </p>
                                {node.description && (
                                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-40 bg-amber-950 text-white p-3 rounded-2xl text-[9px] font-medium leading-relaxed opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl">
                                        {node.description}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </foreignObject>
                ))}
            </svg>

            {/* Legend / Overlay */}
            <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-amber-100 text-[9px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Begreb
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-amber-100 text-[9px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> Aktør
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-amber-100 text-[9px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Proces
                </div>
            </div>

            <div className="absolute bottom-8 right-8 text-[10px] text-amber-950/20 font-black uppercase tracking-[0.2em]">
                Interaktiv Visualisering
            </div>
        </div>
    );
}
