'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Presentation,
  ArrowLeft, 
  Sparkles, 
  UploadCloud,
  File,
  X,
  Loader2,
  Tags,
  Scale,
  Wrench,
  FileText,
  CheckCircle,
  Info,
  History,
  Layers,
  Zap,
  ChevronRight,
  BookOpen,
  Lock,
  FileUp,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { seminarArchitectAction, translateSeminarAction } from '@/app/actions';
import type { SeminarAnalysis } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, getDoc, updateDoc } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';

// ---------------------------------------------------------------------------
// File Parsers
// ---------------------------------------------------------------------------

async function extractDataFromPdf(file: File): Promise<{ text: string, images: Record<number, Blob[]> }> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38';
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const slideTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '').join(' ');
    slideTexts.push(`--- SLIDE ${i} ---\n${strings}`);
  }
  return { text: slideTexts.join('\n\n'), images: {} };
}

/**
 * Robust PPTX text extractor using proper XML DOM parsing.
 * Walks the slide XML tree to collect ALL text nodes in reading order,
 * preserving paragraph breaks and handling all text run variants.
 */
async function extractDataFromPptx(file: File): Promise<{ text: string, images: Record<number, Blob[]> }> {
  const PizZip = (await import('pizzip')).default;
  const buffer = await file.arrayBuffer();
  const zip = new PizZip(buffer);

  const slideTexts: string[] = [];
  const slideImages: Record<number, Blob[]> = {};

  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return na - nb;
    });

  if (slideFiles.length === 0) throw new Error('Ingen slides fundet. Er filen en gyldig .pptx?');

  let slideOrder: string[] = slideFiles;

  for (let si = 0; si < slideOrder.length; si++) {
    const fileName = slideOrder[si];
    const slideNum = si + 1;
    
    try {
      const xml = zip.file(fileName)?.asText() || '';
      if (!xml) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      // 1. Extract Images via relationships
    const findImagesInXml = async (xmlPath: string, seen: Set<string>): Promise<Blob[]> => {
      const xml = zip.file(xmlPath)?.asText();
      if (!xml) return [];
      const isSlide = xmlPath.includes('slides/');
      const relPath = isSlide 
        ? xmlPath.replace('slides/', 'slides/_rels/') + '.rels'
        : xmlPath.replace('slideLayouts/', 'slideLayouts/_rels/') + '.rels';
      
      const rXml = zip.file(relPath)?.asText();
      if (!rXml) return [];

      const docFragment = parser.parseFromString(xml, 'text/xml');
      const relDocFragment = parser.parseFromString(rXml, 'text/xml');
      const imageMap: Record<string, string> = {};
      
      const rels = Array.from(relDocFragment.getElementsByTagNameNS('*', 'Relationship'));
      rels.forEach(rel => {
        const type = rel.getAttribute('Type');
        if (type?.includes('relationships/image')) {
          imageMap[rel.getAttribute('Id') || ''] = rel.getAttribute('Target') || '';
        }
      });

      const slideBlobs: Blob[] = [];
      const blips = Array.from(docFragment.getElementsByTagNameNS('*', 'blip'));
      
      blips.forEach(blip => {
        const rId = blip.getAttribute('r:embed') || blip.getAttribute('r:link') ||
                    blip.getAttribute('embed') || 
                    blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') ||
                    blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'link');
        
        if (rId && imageMap[rId]) {
          let target = imageMap[rId];
          const mediaPath = target.startsWith('..') ? target.replace('..', 'ppt') : `ppt/${target}`;
          
          if (seen.has(mediaPath)) return;
          if (mediaPath.endsWith('.emf') || mediaPath.endsWith('.wmf')) return;
          
          const mediaFile = zip.file(mediaPath);
          if (mediaFile) {
            seen.add(mediaPath);
            const ext = mediaPath.split('.').pop()?.toLowerCase();
            let mime = 'image/jpeg';
            if (ext === 'png') mime = 'image/png';
            else if (ext === 'gif') mime = 'image/gif';
            else if (ext === 'svg') mime = 'image/svg+xml';
            else if (ext === 'webp') mime = 'image/webp';
            
            const uint8 = mediaFile.asUint8Array();
            slideBlobs.push(new Blob([uint8.slice().buffer], { type: mime }));
          }
        }
      });
      return slideBlobs;
    };

    // 1. Extract Images (from slide, its layout, and its charts)
    const relFileName = fileName.replace('slides/slide', 'slides/_rels/slide') + '.rels';
    const relXml = zip.file(relFileName)?.asText();
    const slideSeenPaths = new Set<string>();
    const slideImagesArray: Blob[] = await findImagesInXml(fileName, slideSeenPaths);
    
    // Check layout and charts for extra images
    if (relXml) {
      const relDoc = parser.parseFromString(relXml, 'text/xml');
      const allRels = Array.from(relDoc.getElementsByTagNameNS('*', 'Relationship'));
      
      for (const rel of allRels) {
        const type = rel.getAttribute('Type');
        const target = rel.getAttribute('Target');
        if (!target) continue;
        
        if (type?.includes('relationships/slideLayout') || type?.includes('relationships/chart')) {
          const path = target.startsWith('..') ? target.replace('..', 'ppt') : `ppt/${target}`;
          const subIcons = await findImagesInXml(path, slideSeenPaths);
          slideImagesArray.push(...subIcons);
        }
      }
    }
    
    if (slideImagesArray.length > 0) slideImages[slideNum] = slideImagesArray;

      // 2. Extract Text
      const paragraphs: string[] = [];
      const txBodies = Array.from(doc.getElementsByTagNameNS('*', 'txBody'));
      const allParas: Element[] = [];
      txBodies.forEach(tb => {
        Array.from(tb.getElementsByTagNameNS('*', 'p')).forEach(p => allParas.push(p as Element));
      });

      if (allParas.length === 0) {
        Array.from(doc.getElementsByTagNameNS('*', 'p')).forEach(p => allParas.push(p as Element));
      }

      for (const para of allParas) {
        const runs: string[] = [];
        const tNodes = Array.from(para.getElementsByTagNameNS('*', 't'));
        tNodes.forEach(t => {
          const txt = t.textContent?.trim();
          if (txt) runs.push(txt);
        });
        const lineText = runs.join(' ').trim();
        if (lineText) paragraphs.push(lineText);
      }

      if (paragraphs.length === 0) {
        const rawMatches = xml.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
        rawMatches.forEach(m => {
          const txt = m.replace(/<[^>]+>/g, '').trim();
          if (txt) paragraphs.push(txt);
        });
      }

      const slideText = paragraphs.join('\n').trim();
      slideTexts.push(`--- SLIDE ${slideNum} ---\n${slideText || '(Ingen tekst)'}`);
    } catch (err) {
      console.warn(`[PPTX] Failed to parse slide ${slideNum}:`, err);
      slideTexts.push(`--- SLIDE ${slideNum} ---\n(Fejl under udlæsning af slide)`);
    }
  }

  return { text: slideTexts.join('\n\n'), images: slideImages };
}

async function extractData(file: File): Promise<{ text: string, images: Record<number, Blob[]> }> {
  const isPptx = file?.name.toLowerCase().endsWith('.pptx') || file.type.includes('presentationml');
  if (isPptx) return extractDataFromPptx(file);
  return extractDataFromPdf(file);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SlideCard = ({ slide, notes, onNotesChange, isSelected, onSelect }: { slide: any; notes: string; onNotesChange: (val: string) => void; isSelected?: boolean; onSelect?: (e: React.MouseEvent) => void }) => (
  <div className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden group relative ${
    isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-lg'
  }`}>
    {onSelect && (
      <button 
        onClick={onSelect}
        className={`absolute left-6 top-10 z-20 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
          isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 opacity-0 group-hover:opacity-100'
        }`}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </button>
    )}
    <div className={`${onSelect ? 'pl-8' : ''}`}>
      {/* Card Header */}
      <div className="flex items-center gap-4 p-6 sm:p-8 border-b border-slate-50">
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
          {slide.slideNumber}
        </div>
        <h3 className="text-lg font-bold text-slate-900 leading-tight">{slide.slideTitle}</h3>
      </div>

    {/* Card Body */}
    <div className="p-6 sm:p-8 space-y-6">
      <div className="space-y-4">
        <p className="text-slate-500 leading-relaxed text-sm italic border-l-2 border-indigo-100 pl-4">{slide.summary}</p>
        
        {slide.imageUrls && slide.imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
            {slide.imageUrls.map((url: string, i: number) => (
              <div key={i} className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group/img cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
                <img src={url} alt={`Slide ${slide.slideNumber} image ${i}`} className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/5 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
        <div className="space-y-5">
          {slide.keyConcepts?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Tags className="w-3 h-3" /> Begreber
              </h4>
              <div className="flex flex-wrap gap-2">
                {slide.keyConcepts.map((c: any, i: number) => (
                  <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`}>
                    <span className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[10px] font-bold hover:bg-violet-100 transition-colors cursor-pointer">
                      {c.term}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {slide.legalFrameworks?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Scale className="w-3 h-3" /> Jura
              </h4>
              <ul className="space-y-2.5">
                {slide.legalFrameworks.map((l: any, i: number) => (
                  <li key={i} className="text-xs">
                    <span className="font-bold text-slate-900">{l.law} {l.paragraphs?.join(', ')}</span>
                    <p className="text-slate-500 mt-0.5">{l.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {slide.practicalTools?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Wrench className="w-3 h-3" /> Metoder
              </h4>
              <ul className="space-y-2.5">
                {slide.practicalTools.map((t: any, i: number) => (
                  <li key={i} className="text-xs">
                    <span className="font-bold text-slate-900">{t.tool}</span>
                    <p className="text-slate-500 mt-0.5">{t.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              <FileText className="w-3 h-3" /> Egne Noter
            </h4>
            <Textarea
              placeholder="Notér vigtige pointer..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="bg-slate-50 border-slate-100 rounded-2xl text-xs min-h-[90px] focus:ring-indigo-500 focus:border-indigo-300 resize-none"
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Drop Zone Sub-component
// ---------------------------------------------------------------------------
const FileDropZone = ({ file, onFile, onClear }: { file: File | null; onFile: (f: File) => void; onClear: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  const isPptx = file?.name.endsWith('.pptx');

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
    >
      {file ? (
        <div className="flex items-center justify-between p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isPptx ? 'bg-orange-100' : 'bg-red-100'}`}>
              <File className={`w-6 h-6 ${isPptx ? 'text-orange-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 max-w-[220px] truncate">{file.name}</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">
                {isPptx ? 'PowerPoint' : 'PDF'} · Klar til analyse
              </p>
            </div>
          </div>
          <button onClick={onClear} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center gap-5 w-full border-2 border-dashed rounded-[2rem] p-12 sm:p-16 cursor-pointer transition-all
            ${isDragging ? 'border-orange-400 bg-orange-50/50' : 'border-slate-100 hover:border-orange-300 hover:bg-orange-50/30'}`}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isDragging ? 'bg-orange-100' : 'bg-slate-50'}`}>
            <FileUp className={`w-10 h-10 transition-colors ${isDragging ? 'text-orange-500' : 'text-slate-300'}`} />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 mb-1">Vælg eller træk din fil herover</p>
            <p className="text-xs text-slate-400">Understøtter <strong className="text-orange-500">PowerPoint (.pptx)</strong> og <strong className="text-orange-500">PDF (.pdf)</strong></p>
          </div>
          <input
            id="file-upload"
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
            onChange={(e) => e.target.files && onFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

function SeminarArchitectPageContent() {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeminarAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideNotes, setSlideNotes] = useState<Record<number, string>>({});
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [debouncedNotes] = useDebounce(slideNotes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'cards' | 'overview'>('cards');
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'da' | 'en'>('da');
  const isInitialMount = useRef(true);

  const isPremiumUser = useMemo(() =>
    !!userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership ?? ''),
    [userProfile]
  );
  
  const handleToggleSelect = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!analysisResult) return;
    if (selectedSlides.size === analysisResult.slides.length) {
      setSelectedSlides(new Set());
    } else {
      setSelectedSlides(new Set(analysisResult.slides.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = () => {
    if (!analysisResult || selectedSlides.size === 0) return;
    if (!confirm(`Er du sikker på at du vil slette ${selectedSlides.size} slides? Dette kan ikke fortrydes.`)) return;

    const newSlides = analysisResult.slides.filter((_, i) => !selectedSlides.has(i));
    setAnalysisResult({ ...analysisResult, slides: newSlides });
    setSelectedSlides(new Set());
    
    toast({
        title: "Slides slettet",
        description: `${selectedSlides.size} slides er blevet fjernet fra analysen.`,
    });
  };

  useEffect(() => {
    if (file && !isAnalyzing && !analysisResult) {
      handleAnalyze();
    }
  }, [file]);

  const handleAnalyze = async () => {
    if (!file || !user || !firestore || !userProfile || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    setSlideNotes({});
    setSavedAnalysisId(null);

    // Total limit for free tier (1 upload in total)
    if (!isPremiumUser) {
      if ((userProfile.totalSeminarAnalyses || 0) >= 1) {
        setError('Du har allerede brugt din gratis analyse. Opgrader til Kollega+ for ubegrænset brug.');
        setIsAnalyzing(false);
        return;
      }
    }

    try {
      const { text: slideText, images: slideImages } = await extractData(file);
      const response = await seminarArchitectAction({ slideText, semester: userProfile.semester || '1. semester' });

      if (!response?.data) throw new Error('Ingen data returneret fra analysen.');

      const analysisData = response.data;
      const newSeminarRef = doc(collection(firestore!, 'users', user.uid, 'seminars'));

      // 1. Collect all slide numbers from both AI results and extracted images
      const allSlideNums = Array.from(new Set([
        ...analysisData.slides.map((s: any) => s.slideNumber),
        ...Object.keys(slideImages).map(Number)
      ])).sort((a, b) => a - b);

      // 2. Map through all slides to ensure none are missed (and upload images)
      const finalSlides = await Promise.all(allSlideNums.map(async (num) => {
        let s = analysisData.slides.find((os: any) => os.slideNumber === num);
        
        // If AI skipped this slide (common if it has no text), create a placeholder
        if (!s) {
          s = {
            slideNumber: num,
            slideTitle: 'Billedbaseret slide',
            summary: 'Denne slide indeholder primært visuelt indhold.',
            keyConcepts: [],
            legalFrameworks: [],
            practicalTools: [],
            imageUrls: []
          };
        }

        const slideBlobs = slideImages[num] || [];
        if (slideBlobs.length === 0) return s;

        try {
          const urls = await Promise.all(slideBlobs.map(async (blob, idx) => {
            const fileName = `slide${num}_img${idx}`;
            const storageRef = ref(storage!, `seminar-images/${user.uid}/${newSeminarRef.id}/${fileName}`);
            await uploadBytes(storageRef, blob, { contentType: blob.type });
            return await getDownloadURL(storageRef);
          }));
          return { ...s, imageUrls: urls };
        } catch (imgErr) {
          console.warn(`Failed to upload images for slide ${num}:`, imgErr);
          return s;
        }
      }));

      const finalAnalysis: SeminarAnalysis = { ...analysisData, slides: finalSlides };
      setAnalysisResult(finalAnalysis);

      const batch = writeBatch(firestore!);
      const userRef = doc(firestore!, 'users', user.uid);
      batch.set(newSeminarRef, { 
        ...finalAnalysis, 
        fileName: file.name, 
        ownerUid: user.uid,
        ownerName: userProfile.username || user.displayName || 'Anonym',
        ownerEmail: user.email,
        createdAt: serverTimestamp() 
      });
      setSavedAnalysisId(newSeminarRef.id);

      const activityRef = doc(collection(firestore!, 'userActivities'));
      batch.set(activityRef, {
        userId: user.uid,
        userName: userProfile.username || user.displayName || 'Anonym',
        actionText: 'analyserede et seminar med Seminar-Arkitekten.',
        createdAt: serverTimestamp(),
      });

      const userUpdates: Record<string, any> = { 
        lastSeminarArchitectUsage: serverTimestamp(),
        totalSeminarAnalyses: increment(1)
      };
      if (response.usage) {
        const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
        const pts = Math.round(totalTokens * 0.05);
        if (pts > 0) userUpdates['cohéroPoints'] = increment(pts);
      }
      batch.update(userRef, userUpdates);
      await batch.commit();
      await refetchUserProfile();

      toast({ title: 'Videnskort Gemt!', description: `Analyserede ${response.data.slides.length} slides.` });
    } catch (err: any) {
      console.error('[SeminarArchitect]', err);
      setError(err.message || 'Der opstod en fejl under analysen. Prøv venligst igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslate = async (lang: 'da' | 'en') => {
    if (!analysisResult || isTranslating) return;
    setIsTranslating(true);
    setCurrentLanguage(lang);
    try {
        const response = await translateSeminarAction({ analysis: analysisResult, targetLanguage: lang });
        if (response?.data) {
            setAnalysisResult(response.data);
            toast({ title: 'Oversat!', description: `Seminaret er nu på ${lang === 'da' ? 'dansk' : 'engelsk'}.` });
        }
    } catch (err: any) {
        toast({ title: 'Oversættelse fejlede', description: err.message, variant: 'destructive' });
    } finally {
        setIsTranslating(false);
    }
  };

  const handleAutoSaveNotes = useCallback(async () => {
    if (!user || !firestore || !savedAnalysisId || Object.keys(debouncedNotes).length === 0) return;
    setSaveStatus('saving');
    try {
      const ref = doc(firestore, 'users', user.uid, 'seminars', savedAnalysisId);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setSaveStatus('idle'); return; }
      const updated = (snap.data().slides || []).map((s: any) => ({ ...s, notes: debouncedNotes[s.slideNumber] ?? s.notes ?? '' }));
      await updateDoc(ref, { slides: updated });
      setSaveStatus('saved');
    } catch { setSaveStatus('idle'); }
  }, [user, firestore, savedAnalysisId, debouncedNotes]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (savedAnalysisId) handleAutoSaveNotes();
  }, [debouncedNotes, savedAnalysisId, handleAutoSaveNotes]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (saveStatus === 'saved') t = setTimeout(() => setSaveStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  if (!isPremiumUser && (userProfile?.totalSeminarAnalyses || 0) >= 1 && !analysisResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[36px] border border-slate-100 shadow-2xl shadow-slate-900/5 p-10 sm:p-14 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-500/20">
            <Presentation className="w-10 h-10" />
          </div>
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Kollega+ Funktion</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Seminar-Arkitekten</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10">
            Du har brugt din gratis analyse. Opgrader til Kollega+ for at uploade flere koherente seminar-planer og få ubegrænset adgang til Seminar-Arkitekten.
          </p>
          <Link href="/upgrade" className="w-full">
            <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              <Sparkles className="w-4 h-4 mr-2" /> Opgrader til Kollega+
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Presentation className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900">Seminar-Arkitekten</h1>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Fra slides til videnskort</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemmer...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Gemt</span>
              </div>
            )}
            <Link href="/mine-seminarer">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <History className="w-4 h-4 mr-2" /> Arkiv
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-2xl mx-auto"
            >
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600">AI-Vidensbehandling</span>
                </div>

                {!isPremiumUser && (userProfile?.totalSeminarAnalyses || 0) === 0 && (
                  <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">1 Gratis Analyse Tilbage</span>
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-none mb-4">
                  Fra slides til<br /><span className="text-indigo-600 italic">videnskort.</span>
                </h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                  Upload dine seminarslides og lad AI udtrække begreber, lovgivning og metoder til et struktureret studieoverblik.
                </p>
              </div>

              {/* Upload card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 space-y-6">
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 leading-relaxed">
                    Upload din <strong>PowerPoint (.pptx)</strong> eller <strong>PDF (.pdf)</strong> direkte. Vi udtrækker automatisk data og analyserer indholdet.
                  </p>
                </div>

                <FileDropZone file={file} onFile={(f) => {
                  const isPptx = f.name.toLowerCase().endsWith('.pptx');
                  const isPdf = f.name.toLowerCase().endsWith('.pdf');
                  if (!isPptx && !isPdf) {
                    toast({ title: 'Forker filtype', description: 'Kun PowerPoint (.pptx) og PDF (.pdf) er understøttet.', variant: 'destructive' });
                    return;
                  }
                  setFile(f);
                }} onClear={() => setFile(null)} />

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-700">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isAnalyzing
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyserer slides...</>
                    : <><Sparkles className="w-5 h-5 mr-2" /> Generér Videnskort</>
                  }
                </Button>

                {isAnalyzing && (
                  <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
                    <div className="w-12 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full animate-[slide_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Behandler dine slides...</p>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[  
                  { icon: FileUp, label: 'Upload', desc: 'PPTX eller PDF' },
                  { icon: Sparkles, label: 'Analyse', desc: 'AI behandler slides' },
                  { icon: BookOpen, label: 'Videnskort', desc: 'Struktureret overblik' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">{label}</p>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Analyse fuldført</p>
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{analysisResult.overallTitle}</h2>
                    <button 
                      onClick={handleSelectAll}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors mt-2"
                    >
                      {selectedSlides.size === analysisResult.slides.length ? 'Fravælg alle' : 'Vælg alle'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{analysisResult.slides.length} slides analyseret</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm mr-2">
                    <button 
                        onClick={() => handleTranslate('da')}
                        disabled={isTranslating || currentLanguage === 'da'}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentLanguage === 'da' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        DK
                    </button>
                    <button 
                        onClick={() => handleTranslate('en')}
                        disabled={isTranslating || currentLanguage === 'en'}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentLanguage === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        EN
                    </button>
                  </div>

                  {isTranslating && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mr-2" />}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setAnalysisResult(null); setFile(null); }}
                    className="rounded-xl border-slate-200 text-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Ny analyse
                  </Button>
                </div>
              </div>

              {/* Overview stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Slides', val: analysisResult.slides.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { label: 'Begreber', val: analysisResult.slides.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0), color: 'bg-violet-50 text-violet-700 border-violet-100' },
                  { label: 'Love', val: analysisResult.slides.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0), color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Metoder', val: analysisResult.slides.reduce((a, s) => a + (s.practicalTools?.length || 0), 0), color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`bg-white rounded-2xl border p-5 shadow-sm text-center flex flex-col items-center justify-center ${color}`}>
                    <p className="text-2xl font-black">{val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Slide cards */}
              <div className="space-y-5 relative">
                {analysisResult.slides.map((slide, i) => (
                  <SlideCard
                    key={`${slide.slideNumber}-${i}`}
                    slide={slide}
                    notes={slideNotes[slide.slideNumber] || ''}
                    onNotesChange={(val) => setSlideNotes(prev => ({ ...prev, [slide.slideNumber]: val }))}
                    isSelected={selectedSlides.has(i)}
                    onSelect={(e) => handleToggleSelect(i, e)}
                  />
                ))}

                <AnimatePresence>
                  {selectedSlides.size > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.9 }}
                      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-slate-800"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valgt</span>
                        <span className="text-xl font-black serif">{selectedSlides.size} {selectedSlides.size === 1 ? 'slide' : 'slides'}</span>
                      </div>
                      <div className="w-px h-10 bg-slate-800" />
                      <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-3 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        Slet valgte
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-center pb-10">
                <div className="bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
                  {saveStatus === 'saving'
                    ? <><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autogemmer...</span></>
                    : <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Alle ændringer gemt</span></>
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const SeminarArchitectPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace(`/?callbackUrl=${encodeURIComponent(pathname ?? '/')}`);
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || !user) return <AuthLoadingScreen />;
  return <SeminarArchitectPageContent />;
};

export default SeminarArchitectPage;
