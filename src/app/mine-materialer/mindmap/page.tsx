'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Layout, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Download, 
  Maximize2, 
  Share2,
  ZoomIn,
  ZoomOut, 
  RotateCcw,
  ChevronLeft,
  Plus,
  Zap,
  Save,
  Trash2,
  FileText,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    generateMaterialMindmapAction, 
    saveMindmapAction, 
    getMindmapsAction,
    deleteMindmapAction,
    getMindmapNodeSourceAction
} from '@/app/actions';
import { useAuth } from '@/firebase/provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';

export default function MindmapPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 bg-slate-950 flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>}>
            <MindmapContent />
        </Suspense>
    );
}

function MindmapContent() {
    const { user, userProfile, isUserLoading, setIsNavbarHidden } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const materialId = searchParams.get('materialId');
    
    const semester = searchParams.get('semesterId') || userProfile?.semester;
    
    const [mindmapData, setMindmapData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [loadingContext, setLoadingContext] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [savedMindmaps, setSavedMindmaps] = useState<any[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | 'new'>('new');
    const [isSaving, setIsSaving] = useState(false);
    
    // Node Source Modal State
    const [selectedNode, setSelectedNode] = useState<{ text: string, description?: string } | null>(null);
    const [nodeSources, setNodeSources] = useState<any[]>([]);
    const [isSourceLoading, setIsSourceLoading] = useState(false);
    
    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean,
        title: string,
        description: string,
        placeholder: string,
        defaultValue: string,
        onConfirm: (val: string) => void
    }>({
        isOpen: false,
        title: '',
        description: '',
        placeholder: '',
        defaultValue: '',
        onConfirm: () => {}
    });

    const openInputModal = (config: Omit<typeof modalConfig, 'isOpen'>) => {
        setModalConfig({ ...config, isOpen: true });
    };

    // Handle scroll to zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(prev => Math.min(2, Math.max(0.3, prev + delta)));
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);
    // Auto-center on load (Start at top)
    useEffect(() => {
        if (mindmapData && containerRef.current) {
            const container = containerRef.current;
            container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
            container.scrollTop = (container.scrollHeight - container.clientHeight) * 0.45; // Start near the top area where root is
        }
    }, [mindmapData]);

    const fetchMindmap = async (customFocus?: string) => {
        if (!user) {
            console.log("Mindmap: No user found yet");
            return;
        }
        if (!semester) {
            console.log("Mindmap: No semester found yet");
            return;
        }

        console.log("Mindmap: Starting fetch for", materialId || 'all', "Focus:", customFocus);
        setLoadingContext(customFocus || "et generelt overblik");
        setIsLoading(true);
        setError(null);
        try {
            const res = await generateMaterialMindmapAction({
                userId: user.uid,
                semesterId: semester as string,
                materialId: materialId || undefined,
                focus: customFocus
            });
            
            if (res.success) {
                console.log("Mindmap: Success", res.mindmap);
                setMindmapData(res.mindmap);
            } else {
                console.error("Mindmap: Action failed", res.error);
                setError(res.error || "Kunne ikke generere mindmap.");
            }
        } catch (err: any) {
            console.error("Mindmap: Fetch error", err);
            setError("Der skete en fejl ved indlæsning.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMindmaps = async () => {
        if (user && semester) {
            const res = await getMindmapsAction(user.uid, semester);
            if (res.success && res.mindmaps) {
                // Sort by createdAt desc in frontend
                const sorted = [...res.mindmaps].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setSavedMindmaps(sorted);

                // Auto-select last saved if we are on 'new' and have no data yet
                if (activeTabId === 'new' && !mindmapData && !materialId && sorted.length > 0) {
                    selectTab(sorted[0]);
                }
            }
        }
    };

    useEffect(() => {
        fetchMindmaps();
    }, [user, semester]);

    const handleSave = async () => {
        if (!user || !semester || !mindmapData || isSaving) return;
        
        const defaultTitle = mindmapData.root?.text || "Nyt Mindmap";
        
        openInputModal({
            title: "Gem Mindmap",
            description: "Giv dit mindmap et sigende navn, så du nemt kan finde det igen senere.",
            placeholder: "F.eks. Eksamensforberedelse - Socialret",
            defaultValue: defaultTitle,
            onConfirm: async (title) => {
                setIsSaving(true);
                const res = await saveMindmapAction({
                    userId: user.uid,
                    semesterId: semester,
                    title,
                    data: mindmapData
                });
                
                if (res.success) {
                    const updatedRes = await getMindmapsAction(user.uid, semester);
                    if (updatedRes.success) {
                        setSavedMindmaps(updatedRes.mindmaps || []);
                        setActiveTabId(res.id as string);
                    }
                }
                setIsSaving(false);
            }
        });
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (confirm("Er du sikker på, at du vil slette dette mindmap?")) {
            const res = await deleteMindmapAction(user.uid, id);
            if (res.success) {
                if (activeTabId === id) {
                    setActiveTabId('new');
                    setMindmapData(null);
                }
                await fetchMindmaps();
            }
        }
    };

    const selectTab = (tab: any) => {
        if (tab === 'new') {
            openInputModal({
                title: "Nyt Mindmap",
                description: "Hvad skal AI'en have særligt fokus på i dette overblik? (Valgfrit)",
                placeholder: "F.eks. Teorier om stress, Lovgivning, Metode...",
                defaultValue: "",
                onConfirm: (focus) => {
                    setActiveTabId('new');
                    setMindmapData(null);
                    fetchMindmap(focus || undefined);
                }
            });
        } else {
            setActiveTabId(tab.id);
            setMindmapData(tab.data);
            setIsLoading(false);
        }
    };

    const colorClasses = {
        indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100',
        emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
        rose: 'bg-rose-500/10 border-rose-500/30 text-rose-100',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-100',
        sky: 'bg-sky-500/10 border-sky-500/30 text-sky-100',
    };

    const handleExport = () => {
        if (!mindmapData) return;
        
        let content = `# Studie-guide: ${mindmapData.root.text}\n\n`;
        content += `Genereret af Cohéro AI\n\n`;
        
        mindmapData.root.children?.forEach((branch: any) => {
            content += `## ${branch.text}\n`;
            branch.children?.forEach((child: any) => {
                content += `### ${child.text}\n`;
                content += `${child.description}\n\n`;
            });
            content += `\n`;
        });
        
        if (mindmapData.connections && mindmapData.connections.length > 0) {
            content += `## Tværgående Sammenhænge\n`;
            mindmapData.connections.forEach((conn: any) => {
                content += `- **Forbindelse:** ${conn.label}\n`;
            });
        }
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Studieguide - ${mindmapData.root.text}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOneNoteExport = () => {
        if (!mindmapData) return;
        
        let html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px;">
                <h1 style="color: #6366f1;">Mindmap: ${mindmapData.root.text}</h1>
                <p><i>Genereret af Cohéro AI - Studieguide</i></p>
                <hr />
                <ul style="list-style-type: none; padding-left: 0;">
                    <li style="margin-bottom: 20px;">
                        <strong style="font-size: 24px; color: #1e293b;">${mindmapData.root.text}</strong>
                        <ul style="margin-top: 15px;">
                            ${mindmapData.root.children?.map((branch: any) => `
                                <li style="margin-bottom: 15px;">
                                    <span style="font-size: 18px; font-weight: bold; color: ${
                                        branch.color === 'indigo' ? '#6366f1' :
                                        branch.color === 'emerald' ? '#10b981' :
                                        branch.color === 'rose' ? '#f43f5e' :
                                        branch.color === 'amber' ? '#f59e0b' :
                                        branch.color === 'sky' ? '#0ea5e9' : '#64748b'
                                    }; text-transform: uppercase;">${branch.text}</span>
                                    <ul style="margin-top: 5px;">
                                        ${branch.children?.map((child: any) => `
                                            <li style="margin-bottom: 10px;">
                                                <strong>${child.text}</strong><br />
                                                <span style="color: #64748b; font-size: 14px;">${child.description || ''}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </li>
                            `).join('')}
                        </ul>
                    </li>
                </ul>
                ${mindmapData.connections && mindmapData.connections.length > 0 ? `
                    <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <h3 style="color: #f59e0b; margin-top: 0;">Tværgående Sammenhænge</h3>
                        <ul>
                            ${mindmapData.connections.map((conn: any) => `<li>${conn.label}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        const type = "text/html";
        const blob = new Blob([html], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        
        navigator.clipboard.write(data).then(() => {
            alert("Mindmap er nu kopieret i OneNote-format! Du kan nu sætte det direkte ind i OneNote (Ctrl+V).");
        });
    };

    const handleNodeClick = async (node: any) => {
        if (!user || !semester) return;
        setSelectedNode(node);
        setNodeSources([]);
        setIsSourceLoading(true);
        const res = await getMindmapNodeSourceAction({
            userId: user.uid,
            semesterId: semester,
            nodeText: node.text
        });
        if (res.success) {
            setNodeSources(res.sources || []);
        }
        setIsSourceLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative z-[500]">
            {/* TOP BAR */}
            <header className="h-16 bg-slate-950/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-amber-500" />
                            <h1 className="text-sm font-black text-white uppercase tracking-widest">Mine Mindmaps</h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={!mindmapData || isSaving || activeTabId !== 'new'}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                    >
                        {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {activeTabId === 'new' ? 'Gem Mindmap' : 'Gemt'}
                    </button>
                    <button 
                        onClick={() => fetchMindmap()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Gendan AI
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        Eksportér Noter
                    </button>
                    <button 
                        onClick={handleOneNoteExport}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.52,2.05L2.34,3.94C2.14,3.98 2,4.16 2,4.37V19.63C2,19.84 2.14,20.02 2.34,20.06L11.52,21.95C11.54,21.95 11.57,21.95 11.6,21.95C11.82,21.95 12,21.77 12,21.55V2.45C12,2.23 11.82,2.05 11.6,2.05C11.57,2.05 11.54,2.05 11.52,2.05M22,5.25V18.75C22,19.3 21.55,19.75 21,19.75H13V4.25H21C21.55,4.25 22,4.7 22,5.25Z" />
                        </svg>
                        OneNote
                    </button>
                </div>
            </header>

            {/* TAB BAR */}
            <div className="h-12 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center px-4 gap-2 overflow-x-auto scrollbar-hide shrink-0">
                <button 
                    onClick={() => selectTab('new')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTabId === 'new' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    <Plus className="w-3 h-3" />
                    Nyt Mindmap
                </button>
                
                <div className="w-px h-4 bg-white/10 mx-2" />

                {savedMindmaps.map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => selectTab(tab)}
                        className={`group flex items-center gap-3 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTabId === tab.id ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'bg-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <FileText className="w-3 h-3 text-amber-500/50 group-hover:text-amber-500" />
                        {tab.title}
                        {activeTabId === tab.id && (
                            <Trash2 
                                onClick={(e) => handleDelete(tab.id, e)}
                                className="w-3 h-3 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" 
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* MINDMAP CANVAS */}
            <main 
                ref={containerRef}
                className="flex-1 overflow-auto relative bg-[#0B0E14] scrollbar-hide"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />

                <div className="h-full w-full relative">
                    <motion.div 
                        drag
                        dragMomentum={false}
                        animate={{ 
                            scale: zoom,
                            x: pan.x,
                            y: pan.y
                        }}
                        onDragEnd={(_, info) => {
                            setPan(prev => ({
                                x: prev.x + info.offset.x,
                                y: prev.y + info.offset.y
                            }));
                        }}
                        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing p-[1000px] min-w-max min-h-max"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-10">
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-24 h-24 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-indigo-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <h2 className="text-xl font-[950] text-white uppercase tracking-[0.4em]">AI Arkitekten Konstruerer</h2>
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-4">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Analyserer pensum om:</p>
                                        <p className="text-indigo-400 font-black italic text-lg">"{loadingContext}"</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 pt-2">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-2 h-2 bg-indigo-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-4">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-white">{error}</h3>
                                <p className="text-slate-400 font-bold">Der opstod en fejl under genereringen af dit mindmap. Prøv venligst igen.</p>
                                <Button onClick={() => fetchMindmap()} className="bg-indigo-600 text-white rounded-2xl h-14 px-10 mt-4">Prøv igen</Button>
                            </div>
                        ) : mindmapData ? (
                            <div className="flex flex-col items-center space-y-24 min-w-max relative">
                                {/* SVG CONNECTIONS (Cross-links) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0 opacity-40">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(245, 158, 11, 0.5)" />
                                        </marker>
                                    </defs>
                                    {mindmapData.connections?.map((conn: any, cIdx: number) => {
                                        const fromEl = document.getElementById(conn.from);
                                        const toEl = document.getElementById(conn.to);
                                        if (!fromEl || !toEl) return null;
                                        
                                        // Simple approximation as we are in a motion div
                                        // Real implementation would use absolute positioning tracking
                                        return null; 
                                    })}
                                </svg>

                                {/* ROOT NODE */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative group"
                                >
                                    <div 
                                        id={mindmapData.root.id || 'root'}
                                        onClick={() => handleNodeClick(mindmapData.root)}
                                        className="px-16 py-10 bg-white text-slate-950 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] relative z-10 border-[6px] border-indigo-500/20 cursor-pointer hover:scale-105 transition-transform"
                                    >
                                        <h2 className="text-4xl font-[950] tracking-tighter text-center">{mindmapData.root.text}</h2>
                                    </div>
                                    <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity rounded-[4rem]" />
                                </motion.div>

                                {/* BRANCHES */}
                                <div className="flex items-start gap-20">
                                    {mindmapData.root.children?.map((branch: any, bIdx: number) => (
                                        <div key={bIdx} className="flex flex-col items-center space-y-12 w-[350px]">
                                            {/* Branch Node */}
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: bIdx * 0.1 }}
                                                className="w-full relative"
                                            >
                                                <div 
                                                    id={branch.id}
                                                    onClick={() => handleNodeClick(branch)}
                                                    className={`p-10 rounded-[2.5rem] ${colorClasses[branch.color as keyof typeof colorClasses] || colorClasses.indigo} shadow-2xl relative z-10 min-w-[300px] cursor-pointer hover:scale-105 transition-transform`}
                                                >
                                                    <h3 className="text-xl font-black tracking-tight text-center">{branch.text}</h3>
                                                </div>
                                                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 opacity-30 ${
                                                    branch.color === 'indigo' ? 'bg-indigo-500' :
                                                    branch.color === 'emerald' ? 'bg-emerald-500' :
                                                    branch.color === 'rose' ? 'bg-rose-500' :
                                                    branch.color === 'amber' ? 'bg-amber-500' :
                                                    branch.color === 'sky' ? 'bg-sky-500' :
                                                    'bg-white'
                                                }`} />
                                            </motion.div>

                                            {/* Sub Nodes */}
                                            <div className="flex flex-col gap-6 w-full relative">
                                                {branch.children?.map((child: any, nIdx: number) => (
                                                    <motion.div 
                                                        key={nIdx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: (bIdx * 0.1) + (nIdx * 0.05) }}
                                                        className="relative"
                                                    >
                                                        <motion.div 
                                                            id={child.id}
                                                            onClick={() => handleNodeClick(child)}
                                                            whileHover={{ x: 10, scale: 1.02 }}
                                                            className="p-8 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl hover:border-white/20 transition-all group/node cursor-pointer"
                                                        >
                                                            <h4 className="text-sm font-black text-white group-hover/node:text-amber-400 transition-colors mb-3">{child.text}</h4>
                                                            {child.description && (
                                                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[250px]">{child.description}</p>
                                                            )}
                                                        </motion.div>
                                                        {/* Connector to Branch */}
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-white/10" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <p className="text-slate-400 font-bold">Venter på data...</p>
                                <Button onClick={() => fetchMindmap()} className="bg-indigo-600 text-white rounded-2xl h-14 px-10">Start Generering</Button>
                                {mindmapData && (
                                    <pre className="text-[8px] text-slate-700 max-w-lg overflow-auto mt-10">
                                        {JSON.stringify(mindmapData, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* SOURCE EXCERPT MODAL */}
            <AnimatePresence>
                {selectedNode && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNode(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-white/5 shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-xl">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Kilde-uddrag</span>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedNode(null)}
                                        className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5 rotate-90" />
                                    </button>
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{selectedNode.text}</h3>
                                {selectedNode.description && (
                                    <p className="mt-2 text-slate-400 text-sm font-medium italic">"{selectedNode.description}"</p>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/20">
                                {isSourceLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <RotateCcw className="w-8 h-8 text-amber-500 animate-spin" />
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Gennemsøger biblioteket...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {nodeSources.map((source, sIdx) => (
                                            <motion.div 
                                                key={sIdx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: sIdx * 0.1 }}
                                                className="relative"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-500 border border-amber-500/20">
                                                        {sIdx + 1}
                                                    </div>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                
                                                <p className="text-slate-300 text-lg leading-[1.8] font-medium whitespace-pre-wrap pl-4 border-l-2 border-amber-500/20 mb-6">
                                                    {source.text}
                                                </p>
                                                
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kilde</p>
                                                    <p className="text-xs text-slate-400 leading-relaxed font-bold">
                                                        {source.citation}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-slate-950 border-t border-white/5 shrink-0 flex justify-end">
                                <button 
                                    onClick={() => setSelectedNode(null)}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Luk vindue
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FLOATING ZOOM CONTROLS */}
            <div className="fixed bottom-24 right-10 flex items-center gap-4 z-[600]">
                <div className="flex items-center bg-slate-900/80 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-2xl">
                    <button 
                        onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} 
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <div className="w-16 text-center">
                        <span className="text-[10px] font-black text-white">{Math.round(zoom * 100)}%</span>
                    </div>
                    <button 
                        onClick={() => setZoom(z => Math.min(2, z + 0.1))} 
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-2" />
                    <button 
                        onClick={() => { setZoom(1); setPan({x:0, y:0}); }} 
                        className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <button 
                    onClick={() => {
                        const main = document.querySelector('main');
                        if (main) {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                main.parentElement?.requestFullscreen();
                            }
                        }
                    }}
                    className="p-3 bg-slate-900/80 backdrop-blur-xl text-slate-400 hover:text-white rounded-2xl border border-white/10 shadow-2xl transition-all"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>

            {/* FOOTER CONTROLS */}
            <footer className="h-16 bg-slate-900 border-t border-white/5 flex items-center justify-center gap-12 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hovedområder</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-white/10 border border-white/20 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Underpunkter</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Indsigt</span>
                </div>
            </footer>

            {/* CUSTOM INPUT MODAL */}
            <AnimatePresence>
                {modalConfig.isOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />
                            
                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">{modalConfig.title}</h3>
                            <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">{modalConfig.description}</p>
                            
                            <div className="space-y-6">
                                <input 
                                    autoFocus
                                    type="text"
                                    defaultValue={modalConfig.defaultValue}
                                    placeholder={modalConfig.placeholder}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            modalConfig.onConfirm(e.currentTarget.value);
                                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                                        }
                                        if (e.key === 'Escape') {
                                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                                        }
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold"
                                    id="modal-input"
                                />
                                
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
                                    >
                                        Annuller
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const val = (document.getElementById('modal-input') as HTMLInputElement).value;
                                            modalConfig.onConfirm(val);
                                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                                        }}
                                        className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Bekræft
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
