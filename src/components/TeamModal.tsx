'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, X, Users } from 'lucide-react';
import { Button } from './ui/button';
import Image from 'next/image';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminUser {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    profession?: string;
    isQualified?: boolean;
    semester?: string;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const firestore = useFirestore();

  const adminUsersQuery = useMemoFirebase(
    () => (firestore && isOpen) ? query(collection(firestore, 'users'), where('role', '==', 'admin')) : null,
    [firestore, isOpen]
  );
  const { data: adminUsers, isLoading, error } = useCollection<AdminUser>(adminUsersQuery);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 md:p-12">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-amber-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-amber-950 serif mb-2">
            Mød Cohéro Teamet
            </h2>
            <p className="text-slate-500">
            Holdet bag platformen, der arbejder for at styrke din faglighed.
            </p>
        </div>

        {isLoading && (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )}
        {error && <p className="text-red-500 text-center">Kunne ikke hente team-medlemmer: {error.message}</p>}

        {!isLoading && adminUsers && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                 {adminUsers.length > 0 ? (
                    adminUsers.map(admin => (
                        <div key={admin.id} className="bg-white p-4 rounded-2xl border border-amber-100/60 flex items-center gap-4">
                            <Image 
                                src={admin.profilePicture || `https://picsum.photos/seed/${admin.id}/64/64`}
                                alt={admin.username || 'Admin user'} 
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-full object-cover bg-slate-200"
                                data-ai-hint="profile person"
                            />
                            <div>
                                <h4 className="font-bold text-amber-950">{admin.username}</h4>
                                {admin.isQualified && admin.profession && (
                                    <p className="text-sm font-semibold text-amber-800">
                                        {admin.profession}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-12">Ingen team-medlemmer fundet.</p>
                )}
            </div>
        )}
         <div className="mt-8 text-center">
            <Button variant="outline" onClick={onClose}>Luk</Button>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;
