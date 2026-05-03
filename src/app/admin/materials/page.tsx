'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, onSnapshot } from 'firebase/firestore';
import { 
  FileText, Search, Clock, ExternalLink, User 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Material {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  semesterName: string;
  institution: string;
  profession: string;
  createdAt: any;
  userId?: string;
  ref?: any;
}

export default function AdminMaterialsPage() {
  const firestore = useFirestore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) return;
    
    // Using collectionGroup to get all materials across all users
    const q = query(collectionGroup(firestore, 'materials'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        const userId = doc.ref.parent.parent?.id;
        return {
          id: doc.id,
          ...data,
          userId,
          ref: doc.ref
        } as Material;
      });
      
      // Sort locally to avoid needing a composite index
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMaterials(docs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching materials:", err);
      setError(err.message);
      setLoading(false);
    });
    
    return () => unsub();
  }, [firestore]);

  const filteredMaterials = materials.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.profession?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Brugermaterialer</h1>
        <p className="text-slate-500 font-medium">Få et overblik over alle dokumenter uploadet af brugere via deres vidensarkiv.</p>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 max-w-md">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Søg på filnavn, bruger-ID eller uddannelse..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          Fejl ved indlæsning: {error}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Fil & Navn</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Kontekst</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Dato & Størrelse</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Handling</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">Henter materialer...</td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">Ingen materialer fundet.</td>
                </tr>
              ) : (
                filteredMaterials.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 w-1/3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-[250px]" title={m.name}>{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 w-1/3">
                      <p className="text-xs font-bold text-slate-900">{m.profession || 'Ikke angivet'}</p>
                      <p className="text-[10px] text-slate-500">{m.institution || 'Ikke angivet'}</p>
                      {m.semesterName && <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]" title={m.semesterName}>{m.semesterName}</p>}
                      {m.userId && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-indigo-600 font-mono bg-indigo-50 px-2.5 py-1 rounded-md max-w-max border border-indigo-100/50">
                          <User className="w-3 h-3" />
                          {m.userId}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 mb-1 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{m.createdAt?.toDate?.().toLocaleDateString('da-DK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Ukendt dato'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {m.size ? (m.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {m.url ? (
                        <a 
                          href={m.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 text-slate-500 rounded-xl transition-all shadow-sm"
                          title="Åbn dokument"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Ingen URL</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
