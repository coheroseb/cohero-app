

'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Users, Mail, Linkedin, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  profession?: string;
  isQualified?: boolean;
}

export default function TeamPage() {
  const firestore = useFirestore();

  const adminUsersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'teamMembers')) : null,
    [firestore]
  );
  const { data: adminUsers, isLoading, error } = useCollection<AdminUser>(adminUsersQuery);

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Mød Teamet
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            Personerne bag Cohéro, dedikeret til at styrke din faglige rejse.
          </p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )}
        {error && <p className="text-red-500 text-center">Kunne ikke hente team-medlemmer: {error.message}</p>}
        
        {!isLoading && adminUsers && (
             <div className="space-y-6">
                {adminUsers.map(admin => (
                    <div key={admin.id} className="bg-white p-6 rounded-2xl border border-amber-100/60 flex flex-col sm:flex-row items-center gap-6">
                        <Image 
                            src={admin.profilePicture || `https://picsum.photos/seed/${admin.id}/96/96`}
                            alt={admin.username}
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full object-cover bg-slate-200"
                            data-ai-hint="profile person"
                        />
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-amber-950 serif">{admin.username}</h2>
                            {admin.profession && (
                                <p className="text-base font-semibold text-amber-800">
                                    {admin.profession}
                                </p>
                            )}
                            <p className="text-sm text-slate-500 mt-2">
                                En kort biografi om teammedlemmet her. Beskriver deres baggrund, erfaring og passion for socialt arbejde og pædagogik.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                                <a href={`mailto:${admin.email}`} className="text-slate-400 hover:text-amber-800"><Mail className="w-5 h-5"/></a>
                                <a href="#" className="text-slate-400 hover:text-amber-800"><Linkedin className="w-5 h-5"/></a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
