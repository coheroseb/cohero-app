'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Sparkles, Navigation, Info, ArrowRight, 
  ZoomIn, ZoomOut, Download, Share2, Activity,
  ChevronDown, ChevronUp, BrainCircuit,
  MessageCircle, Zap, ShieldCheck, Gavel, Trophy,
  MousePointer2, Eye, ChevronRight, Loader2, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/app/provider';
import type { LawFlowchartData, FlowchartNode, FlowchartEdge } from '@/ai/flows/types';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';


interface LawFlowchartModalProps {
  data: LawFlowchartData;
  onClose: () => void;
}

const nodeTypeConfig = {
  start: { icon: Activity, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-950', border: 'border-emerald-100' },
  decision: { icon: ShieldCheck, color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-950', border: 'border-indigo-100' },
  action: { icon: Zap, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-950', border: 'border-amber-100' },
  end: { icon: Trophy, color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-950', border: 'border-rose-100' },
};

const LawFlowchartModal: React.FC<LawFlowchartModalProps> = ({ data, onClose }) => {
  const { setIsNavbarHidden } = useApp();
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});

  useEffect(() => {
    setIsNavbarHidden(true);
    // ESC key support
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        setIsNavbarHidden(false);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsNavbarHidden, onClose]);

  // Hierarchical layout logic
  const { levels } = useMemo(() => {
    const nbl: Record<string, number> = {};
    const processed = new Set<string>();
    
    const find = (id: string, lvl: number) => {
        if (processed.has(id)) return;
        processed.add(id);
        nbl[id] = Math.max(nbl[id] || 0, lvl);
        data.edges.filter(e => e.from === id).forEach(e => find(e.to, lvl + 1));
    };

    data.nodes.filter(n => n.type === 'start' || !data.edges.some(e => e.to === n.id)).forEach(n => find(n.id, 0));

    const lvls: Record<number, string[]> = {};
    Object.entries(nbl).forEach(([id, l]) => {
        if (!lvls[l]) lvls[l] = [];
        lvls[l].push(id);
    });
    return { levels: lvls };
  }, [data]);

  // Capture node positions within the scaled content area
  const updatePositions = () => {
    if (!contentRef.current) return;
    
    const positions: Record<string, { x: number, y: number }> = {};
    const contentRect = contentRef.current.getBoundingClientRect();
    
    data.nodes.forEach(node => {
        const el = document.getElementById(`node-${node.id}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            positions[node.id] = {
                x: (rect.left + rect.width / 2 - contentRect.left) / zoom,
                y: (rect.top + rect.height / 2 - contentRect.top) / zoom
            };
        }
    });
    setNodePositions(positions);
  };

  useEffect(() => {
    const timer = setTimeout(updatePositions, 400); 
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [data, zoom]);

  useEffect(() => {
      const interval = setInterval(updatePositions, 1000);
      return () => clearInterval(interval);
  }, [zoom]);

  // PDF Export Logic
  const handleExportPdf = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    toast({ title: 'PDF Eksport', description: 'Forbereder din PDF...' });


    try {
        // Temporary reset zoom for clean capture
        const originalZoom = zoom;
        setZoom(1);
        await new Promise(r => setTimeout(r, 600)); // Wait for scale transition

        const canvas = await html2canvas(contentRef.current, {
            scale: 2, // Higher quality
            backgroundColor: '#FDFCF8',
            logging: false,
            useCORS: true,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById('chart-content');
                if (el) el.style.transform = 'none'; // Ensure no scale on capture
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${data.title.replace(/\s/g, '_')}_flowchart.pdf`);
        
        setZoom(originalZoom);
        toast({ title: 'Succes', description: 'PDF downloadet!' });
    } catch (error) {
        console.error('PDF Export Error:', error);
        toast({ title: 'Fejl', description: 'Kunne ikke eksportere PDF.' });
    } finally {
        setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 lg:p-10 pointer-events-auto overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#FDFCF8] w-full h-full max-w-7xl rounded-[0] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
      >
        {/* TOP BAR */}
        <div className="px-8 py-6 bg-white/95 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between z-50 shadow-sm">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/20">
                    <Navigation className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 serif-premium tracking-tight">{data.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                           <Activity className="w-3 h-3" /> Start her
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 hidden sm:block">Tryk Esc for at lukke</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomOut className="w-4 h-4 text-slate-400" /></button>
                    <span className="px-3 text-[10px] font-black text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 hover:bg-white rounded-lg transition-all"><ZoomIn className="w-4 h-4 text-slate-400" /></button>
                </div>
                <button 
                  onClick={onClose} 
                  className="px-5 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3 font-black uppercase tracking-widest text-[10px]"
                >
                    <X className="w-4 h-4" /> Luk vindue
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* WORKSPACE AREA */}
            <div className="flex-1 overflow-auto bg-[#FAFAF7] custom-scrollbar" ref={scrollContainerRef}>
                <div 
                    className="relative min-h-full p-20 flex flex-col items-center gap-32" 
                    id="chart-content"
                    ref={contentRef}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center 0' }}
                >
                    {/* SVG LINES */}
                    <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" style={{ width: '100%', height: '100%' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#CBD5E1" />
                            </marker>
                            <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#6366F1" />
                            </marker>
                        </defs>
                        {data.edges.map((edge, i) => {
                            const from = nodePositions[edge.from];
                            const to = nodePositions[edge.to];
                            if (!from || !to) return null;

                            const isSelected = selectedNode === edge.from || selectedNode === edge.to;
                            const cpY = from.y + (to.y - from.y) / 2;
                            
                            return (
                                <g key={i} className="transition-opacity duration-300" style={{ opacity: selectedNode && !isSelected ? 0.2 : 1 }}>
                                    <path 
                                        d={`M ${from.x} ${from.y + 52} C ${from.x} ${cpY}, ${to.x} ${cpY}, ${to.x} ${to.y - 52}`} 
                                        fill="none" 
                                        stroke={isSelected ? '#6366F1' : '#CBD5E1'} 
                                        strokeWidth={isSelected ? 4 : 2}
                                        markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                                    />
                                    {edge.label && (
                                        <foreignObject x={(from.x + to.x) / 2 - 40} y={(from.y + to.y) / 2 - 12} width="80" height="24" className="overflow-visible">
                                            <div className="flex justify-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-100'}`}>
                                                    {edge.label}
                                                </span>
                                            </div>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {Object.entries(levels).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([lvl, ids]) => (
                        <div key={lvl} className="flex flex-wrap justify-center gap-16 md:gap-32 relative z-10">
                            {ids.map(id => {
                                const node = data.nodes.find(n => n.id === id)!;
                                const config = nodeTypeConfig[node.type] || nodeTypeConfig.action;
                                const isSelected = selectedNode === id;
                                const Icon = config.icon;

                                return (
                                    <motion.button
                                        id={`node-${id}`}
                                        key={id}
                                        layout
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setSelectedNode(id)}
                                        className={`
                                            w-64 min-h-[100px] p-7 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-3 relative
                                            ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-2xl z-20' : `bg-white ${config.border} hover:border-indigo-400 shadow-sm z-10`}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : `${config.bg} ${config.text}`}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${isSelected ? 'text-indigo-400' : ''}`}>
                                                {node.type}
                                            </div>
                                        </div>
                                        <h4 className={`text-base font-black leading-tight serif-premium ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                            {node.label}
                                        </h4>
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* INFO PANEL */}
            <div className="w-full md:w-96 bg-white border-l border-slate-100 flex flex-col z-50">
                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 flex items-center gap-2">
                           <BrainCircuit className="w-4 h-4" /> Analyse
                        </h3>
                        <div className="p-7 bg-indigo-50/40 rounded-[2.5rem] border border-indigo-100/30 italic text-sm text-indigo-950/80 leading-relaxed font-medium">
                            {data.summary}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedNode ? (
                            <motion.div 
                                key={selectedNode}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="h-px bg-slate-100" />
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Lovtekst & Vejledning</h3>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 serif-premium leading-tight tracking-tight">
                                        {data.nodes.find(n => n.id === selectedNode)?.label}
                                    </h2>
                                    <div className="bg-slate-50/80 p-7 rounded-[2.5rem] text-sm font-medium text-slate-600 leading-relaxed border border-slate-100/50 shadow-sm whitespace-pre-wrap">
                                        {data.nodes.find(n => n.id === selectedNode)?.description}
                                    </div>
                                </div>
                                
                                {data.edges.filter(e => e.from === selectedNode).length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mulige næste trin</h3>
                                        <div className="grid gap-3">
                                            {data.edges.filter(e => e.from === selectedNode).map((edge, i) => (
                                                <button key={i} className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[1.5rem] group hover:border-indigo-500 transition-all text-left" onClick={() => setSelectedNode(edge.to)}>
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        {edge.label || '→'}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 flex-1 leading-snug">
                                                        {data.nodes.find(n => n.id === edge.to)?.label}
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 px-10">
                                <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 shadow-inner">
                                    <MousePointer2 className="w-12 h-12" />
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">Tryk på boksene i flowchartet for at se uddybende juridisk vejledning.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
                    <Button 
                      onClick={handleExportPdf}
                      disabled={exporting}
                      className="w-full h-14 rounded-2xl bg-indigo-950 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-950/20"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        {exporting ? 'Genererer PDF...' : 'Eksporter som PDF'}
                    </Button>
                    <Button variant="outline" className="w-full h-14 rounded-2xl bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <Share2 className="w-4 h-4 mr-2" /> Del link til flow
                    </Button>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LawFlowchartModal;
