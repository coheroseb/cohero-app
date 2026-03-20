'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { 
    doc, 
    onSnapshot, 
    updateDoc, 
    arrayUnion, 
    serverTimestamp, 
    setDoc, 
    collection, 
    addDoc, 
    deleteDoc,
    query,
    where,
    getDoc,
    writeBatch
} from 'firebase/firestore';
import { Users, Loader2, Sparkles, UserCheck, ArrowRight, UserPlus, LogIn, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

interface PresenceUser {
    id: string;
    username: string;
    photoURL?: string;
    joinedAt: any;
}

export default function JoinGroupQRPage() {
    const params = useParams();
    const tableId = params.tableId as string;
    const { user, userProfile, isUserLoading, openAuthPage } = useApp();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // 1. Manage Presence for this Table
    useEffect(() => {
        if (!firestore || !tableId) return;

        const tableRef = doc(firestore, 'qr_tables', tableId);
        const presenceRef = collection(tableRef, 'presence');

        const unsub = onSnapshot(presenceRef, (snapshot) => {
            const list: PresenceUser[] = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() } as PresenceUser);
            });
            // Sort by joinedAt
            list.sort((a, b) => (a.joinedAt?.toMillis() || 0) - (b.joinedAt?.toMillis() || 0));
            setPresenceList(list);
        });

        return () => unsub();
    }, [firestore, tableId]);

    // 2. Add current user to presence
    useEffect(() => {
        if (!user || !userProfile || !firestore || !tableId || hasJoined) return;

        // Skip if still needs onboarding (provider will handle redirect)
        const needsOnboarding = userProfile === null || (!userProfile.isQualified && (!userProfile.institution || !userProfile.semester));
        if (needsOnboarding) return;

        const joinTable = async () => {
            const presenceDocRef = doc(firestore, 'qr_tables', tableId, 'presence', user.uid);
            await setDoc(presenceDocRef, {
                username: userProfile.username || user.displayName || 'Anonym',
                photoURL: user.photoURL || null,
                joinedAt: serverTimestamp()
            });
            setHasJoined(true);
        };

        joinTable();

        // Cleanup: remove user from presence when they leave the page
        return () => {
            if (user) {
                const presenceDocRef = doc(firestore, 'qr_tables', tableId, 'presence', user.uid);
                deleteDoc(presenceDocRef).catch(console.error);
            }
        };
    }, [user, userProfile, firestore, tableId, hasJoined]);

    // 3. Monitor for Group Creation
    useEffect(() => {
        if (!firestore || !tableId) return;

        const tableRef = doc(firestore, 'qr_tables', tableId);
        const unsub = onSnapshot(tableRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.createdGroupId) {
                // Group was created! Redirect
                router.push(`/rum/groups/view/${data.createdGroupId}`);
            }
        });

        return () => unsub();
    }, [firestore, tableId, router]);

    const handleCreateGroupManually = async () => {
        if (!user || !firestore || !tableId || presenceList.length < 2 || isJoining) return;
        
        setIsJoining(true);
        try {
            const batch = writeBatch(firestore);
            
            // 1. Create the group
            const groupRef = doc(collection(firestore, 'groups'));
            const memberIds = presenceList.map(p => p.id);
            
            batch.set(groupRef, {
                name: `Gruppe - Bord ${tableId.slice(-4)}`,
                description: `Oprettet via QR-kode d. ${new Date().toLocaleDateString('da-DK')}`,
                creatorId: user.uid,
                memberIds: memberIds,
                createdAt: serverTimestamp(),
                membersCount: memberIds.length,
                source: 'qr_code',
                tableId: tableId
            });

            // 2. Add members to subcollection
            for (const member of presenceList) {
                const memberRef = doc(firestore, 'groups', groupRef.id, 'members', member.id);
                batch.set(memberRef, {
                    id: member.id,
                    role: member.id === user.uid ? 'admin' : 'member',
                    joinedAt: serverTimestamp()
                });
            }

            // 3. Mark table as used/group created to trigger redirection for others
            const tableRef = doc(firestore, 'qr_tables', tableId);
            batch.update(tableRef, {
                createdGroupId: groupRef.id,
                lastUsedAt: serverTimestamp()
            });

            await batch.commit();
        } catch (err) {
            console.error(err);
            setIsJoining(false);
        }
    };

    if (isUserLoading) return <AuthLoadingScreen />;

    if (!user) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner text-amber-700">
                    <UserPlus className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold text-amber-950 serif mb-4">Velkommen til bordet</h1>
                <p className="text-slate-500 mb-12 max-w-md italic leading-relaxed">
                    Log ind eller opret en profil for at blive en del af gruppen ved dette bord.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
                    <Button onClick={() => openAuthPage('signup')} className="w-full h-14 rounded-2xl bg-amber-950">Opret profil</Button>
                    <Button onClick={() => openAuthPage('login')} variant="outline" className="w-full h-14 rounded-2xl border-amber-950 text-amber-950">Log ind</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-2xl w-full space-y-12">
                <header className="space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
                        <Users className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-amber-950 serif">I finder sammen nu...</h1>
                    <p className="text-slate-500 italic">Vent på at dine studiekammerater scanner koden ved bordet.</p>
                </header>

                <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-amber-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                        <Sparkles className="w-40 h-40 text-amber-900" />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex flex-wrap justify-center gap-6">
                            <AnimatePresence mode="popLayout">
                                {presenceList.map((p, idx) => (
                                    <motion.div 
                                        key={p.id}
                                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="flex flex-col items-center gap-3"
                                    >
                                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-100 shadow-sm relative overflow-hidden">
                                            {p.photoURL ? (
                                                <img src={p.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCheck className="w-6 h-6 text-amber-700" />
                                            )}
                                            {p.id === user.uid && (
                                                <div className="absolute inset-0 bg-amber-950/10 flex items-center justify-center">
                                                    <div className="bg-amber-950 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Dig</div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/60 max-w-[80px] truncate">{p.username.split(' ')[0]}</span>
                                    </motion.div>
                                ))}
                                
                                {/* Waiting Slots */}
                                {Array.from({ length: Math.max(0, 4 - presenceList.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex flex-col items-center gap-3 opacity-20">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div className="h-2 w-10 bg-slate-200 rounded-full" />
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="pt-8 border-t border-amber-50">
                            {presenceList.length < 2 ? (
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Venter på mindst én mere...
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-amber-900/60">I er {presenceList.length} studerende ved bordet.</p>
                                    <Button 
                                        onClick={handleCreateGroupManually}
                                        disabled={isJoining}
                                        size="lg"
                                        className="h-16 px-12 rounded-2xl bg-amber-950 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        {isJoining ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <>
                                                Opret jeres gruppe nu
                                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="pt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                    Cohéro Project Group • Smart Join
                </footer>
            </div>
        </div>
    );
}
