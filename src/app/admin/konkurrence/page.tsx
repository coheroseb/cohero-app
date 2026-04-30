
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, ArrowLeft, Trophy, Download } from 'lucide-react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface Entry {
  id: string;
  name: string;
  timestamp: Timestamp;
  source: string;
}

export default function CompetitionAdminPage() {
  const firestore = useFirestore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const q = query(
      collection(firestore, 'competition_entries'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Entry[];
      setEntries(entryData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching entries:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const exportToCSV = () => {
    const headers = ['Navn', 'Dato', 'ID'];
    const rows = entries.map(e => [
      e.name,
      e.timestamp?.toDate().toLocaleString('da-DK') || 'N/A',
      e.id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `konkurrence_deltagere_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Tilbage til Admin
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter">Konkurrence Deltagere</h1>
                <p className="text-slate-500 font-medium">Oversigt over alle der har scannet QR-koden i /journey</p>
              </div>
            </div>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Eksporter til CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 rounded-3xl bg-white border border-amber-100 shadow-sm space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Deltagere</p>
              <p className="text-4xl font-black text-slate-900">{entries.length}</p>
           </div>
           <div className="p-8 rounded-3xl bg-white border border-amber-100 shadow-sm space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sidste 24 timer</p>
              <p className="text-4xl font-black text-amber-600">
                {entries.filter(e => e.timestamp?.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
           </div>
           <div className="p-8 rounded-3xl bg-white border border-amber-100 shadow-sm space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Kilde</p>
              <p className="text-xl font-bold text-slate-900">Journey QR</p>
           </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-[2.5rem] border border-amber-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-amber-100">
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Navn</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Dato & Tid</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-medium">
                      Ingen deltagere endnu. QR-koden venter på sin første scanning!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, i) => (
                    <motion.tr 
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {entry.timestamp?.toDate().toLocaleString('da-DK', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-mono text-slate-300">
                        {entry.id}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
