'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, 
  File, 
  Trash2, 
  Loader2, 
  BookOpen, 
  FileBox,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { extractText } from 'unpdf';
import { useApp } from '@/app/provider';
import { useFirestore, useStorage } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveMaterialTextAction, generateMaterialAIOverviewAction } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';

interface Material {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  semester: string;
  createdAt: any;
  isIndexed?: boolean | string;
  storagePath?: string;
}

export default function NativeMineMaterialer() {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [studyMode, setStudyMode] = useState<{ active: boolean, url: string | null, name: string | null }>({ active: false, url: null, name: null });

  const selectedSemesterId = userProfile?.semester || '1';

  useEffect(() => {
    if (!user || !firestore || !userProfile) return;
    
    const q = query(
      collection(firestore, 'users', user.uid, 'materials'),
      where('semester', '==', selectedSemesterId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      // Sort by newest first
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setMaterials(docs);
      setIsLoading(false);
    }, (err) => {
      console.error("[NativeMineMaterialer] Firestore error:", err);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, firestore, userProfile, selectedSemesterId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user || !storage || !firestore || !userProfile) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `users/${user.uid}/materials/${selectedSemesterId}/${fileId}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          console.error("Upload error:", error);
          toast({ variant: 'destructive', title: 'Upload fejlede', description: `Kunne ikke uploade ${file.name}` });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const materialRef = await addDoc(collection(firestore, 'users', user.uid, 'materials'), {
            name: file.name,
            type: file.type,
            size: file.size,
            url: downloadURL,
            semester: selectedSemesterId,
            storagePath: storageRef.fullPath,
            isIndexed: 'processing',
            createdAt: serverTimestamp()
          });

          // Background AI processing to keep archive smart, but we don't await it strictly for UI
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await extractText(new Uint8Array(arrayBuffer));
            let rawText = '';
            if (typeof result.text === 'string') rawText = result.text;
            else if (Array.isArray(result.text)) rawText = result.text.join('\n\n');
            
            if (!rawText.trim()) rawText = "Dette dokument ser ud til at være scannet.";

            await saveMaterialTextAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim()
            });
            
            generateMaterialAIOverviewAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim(),
              candidateLearningGoals: [] 
            }).catch(e => console.error("Auto-AI generation failed:", e));

            await updateDoc(doc(firestore, 'users', user.uid, 'materials', materialRef.id), { 
                isIndexed: true,
                rawText: rawText.trim()
            });
          } catch (indexErr) {
            console.error("Indexing failed:", indexErr);
            await updateDoc(doc(firestore, 'users', user.uid, 'materials', materialRef.id), { isIndexed: 'error' }).catch(console.error);
          }
          
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
          
          if (Object.keys(uploadProgress).length <= 1) {
            setIsUploading(false);
          }
        }
      );
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (!user || !firestore || !storage || !window.confirm('Vil du slette dette dokument?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'materials', material.id));
      if (material.storagePath) {
        const storageRef = ref(storage, material.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      toast({ title: 'Slettet', description: 'Materialet er fjernet.' });
    } catch (e) {
      console.error("Delete error:", e);
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke slette.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* iOS Header */}
      <div className="bg-white border-b border-slate-200/60 pt-6 pb-6 px-4 relative">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                 <FileBox className="w-5 h-5" />
             </div>
             <div>
                 <h1 className="text-xl font-black text-slate-900 tracking-tight">Materialer</h1>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{materials.length} Dokumenter</p>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Button */}
        <label className="flex flex-col items-center justify-center w-full h-24 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-[1.5rem] cursor-pointer transition-all active:scale-[0.98] shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                 {isUploading ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <Upload className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900">{isUploading ? 'Uploader...' : 'Upload Materiale'}</p>
                 <p className="text-xs font-semibold text-slate-500">PDF filer</p>
              </div>
           </div>
           <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={isUploading} />
        </label>

        {/* Progress List */}
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-900 truncate pr-4">{fileName}</p>
                    <p className="text-[10px] font-black text-indigo-600">{Math.round(progress)}%</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>
        ))}

        {/* Materials List */}
        {isLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        ) : materials.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <File className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">Ingen dokumenter</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">Upload dine PDF'er for at læse dem på farten og udnytte AI på din computer.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {materials.map(m => (
                    <div key={m.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 flex items-center justify-between group active:bg-slate-50 transition-colors">
                        <button onClick={() => setStudyMode({ active: true, url: m.url, name: m.name })} className="flex items-center gap-3 flex-1 text-left min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <File className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate leading-tight mb-0.5">{m.name}</p>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>{(m.size / (1024 * 1024)).toFixed(1)} MB</span>
                                    <span>•</span>
                                    {m.isIndexed === true ? (
                                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Klar</span>
                                    ) : m.isIndexed === 'error' ? (
                                        <span className="text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Fejl</span>
                                    ) : (
                                        <span className="text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Analyserer</span>
                                    )}
                                </div>
                            </div>
                        </button>
                        
                        <button onClick={() => handleDeleteMaterial(m)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* PDF VIEWER MODAL */}
      <AnimatePresence>
        {studyMode.active && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed inset-0 bg-white z-[200] flex flex-col"
            >
                <div className="pt-[env(safe-area-inset-top)] bg-slate-900 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white shrink-0">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-black text-white tracking-tight truncate pr-4">{studyMode.name}</h3>
                        </div>
                        <Button 
                            onClick={() => setStudyMode({ active: false, url: null, name: null })}
                            variant="ghost"
                            className="h-8 px-4 bg-white/10 text-white hover:bg-white/20 rounded-lg font-black uppercase tracking-widest text-[9px] shrink-0"
                        >
                            Luk
                        </Button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 relative">
                    <iframe 
                        src={studyMode.url || ''}
                        className="w-full h-full border-none"
                        title="PDF Viewer"
                    />
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
