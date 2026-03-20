

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Book,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

interface BookItem {
  id: string;
  title: string;
  author: string;
  year?: string;
  publisher?: string;
  isbn?: string;
}


export default function PensumPage() {
  const { user } = useApp();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const booksQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'books'), orderBy('title', 'asc')) : null), [firestore]);
  const { data: books, isLoading: booksLoading } = useCollection<BookItem>(booksQuery);

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);
  
  const formatAuthors = (authorString: string): string => {
    if (!authorString) return '';
    return authorString.split(';').map(name => name.trim()).join(', ');
  };


  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
      <header className="bg-white border-b border-amber-100 px-6 py-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link href={user ? "/portal" : "/"} className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <BookOpen className="w-4 h-4 text-amber-700" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/50">Viden & Ressourcer</span>
              </div>
              <h1 className="text-3xl font-bold text-amber-950 serif">Pensum & Anbefalinger</h1>
            </div>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Søg i titler eller forfattere..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-950 focus:outline-none transition-all shadow-inner text-sm font-medium"
            />
          </div>
        </div>
      </header>

       <div className="max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-6 rounded-2xl mb-12 flex items-start gap-4">
            <BookOpen className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900">Vigtigt om AI og Kilder</h3>
              <p className="text-sm text-amber-800/80 mt-1">
                Grundet regler om ophavsret kender Cohéros AI <strong>ikke</strong> det fulde indhold af bøgerne på denne liste. AI'ens viden er baseret på metadata som indholdsfortegnelser og stikordsregistre, samt den generelle faglige viden vores socialrådgivere har kodet den med. Cohéro kan derfor <strong>aldrig citere direkte</strong> fra en bog. Platformen kan guide dig til relevant litteratur, men du skal altid selv slå op og læse i de originale kilder.
              </p>
            </div>
          </div>
          
          {booksLoading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500"/>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map(book => {
                return (
                  <div key={book.id} className="bg-white p-6 rounded-xl border border-amber-100/60 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Book className="w-5 h-5" />
                          </div>
                          <div>
                              <p className="font-bold text-amber-950">{book.title}</p>
                              <p className="text-sm text-slate-500">{`${formatAuthors(book.author)} (${book.year})`}</p>
                          </div>
                      </div>
                      <div className="flex-shrink-0 self-end sm:self-center">
                        <Link href={`/opslagstavle?bookId=${book.id}&bookTitle=${encodeURIComponent(book.title)}&bookAuthor=${encodeURIComponent(book.author)}`}>
                            <Button variant="outline" size="sm" className="group">
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Stil spørgsmål
                            </Button>
                        </Link>
                      </div>
                  </div>
                )
              })}
            </div>
          )}
           {filteredBooks.length === 0 && !booksLoading && (
             <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-amber-100">
                <Search className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                <p className="text-slate-400 italic">Vi fandt ikke nogen bøger, der matchede din søgning.</p>
             </div>
           )}
       </div>
    </div>
  );
}
