'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { Database, Loader2 } from 'lucide-react';

interface PageView extends DocumentData {
  id: string;
  userId: string;
  path: string;
  timestamp: { toDate: () => Date };
}

interface UserData {
  id: string;
  username: string;
}

interface EnrichedPageView extends PageView {
  username?: string;
}

const AdminSystemPage = () => {
    const firestore = useFirestore();

    const pageViewsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'pageViews'), orderBy('timestamp', 'desc'), limit(200)) : null,
        [firestore]
    );
    const { data: pageViews, isLoading: pageViewsLoading } = useCollection<PageView>(pageViewsQuery);

    const usersQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'users')) : null,
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollection<UserData>(usersQuery);

    const [enrichedPageViews, setEnrichedPageViews] = useState<EnrichedPageView[]>([]);

    useEffect(() => {
        if (pageViews && users) {
            const userMap = new Map(users.map(u => [u.id, u.username]));
            const enriched = pageViews.map(view => ({
                ...view,
                username: userMap.get(view.userId) || 'Ukendt Bruger'
            }));
            setEnrichedPageViews(enriched);
        }
    }, [pageViews, users]);

    const isLoading = pageViewsLoading || usersLoading;

    return (
        <div className="space-y-8 animate-ink">
            <section className="bg-white rounded-[3rem] border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-amber-50">
                    <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><Database className="w-5 h-5"/>Aktivitetslog</h3>
                    <p className="text-sm text-slate-500 mt-1">De seneste 200 sidevisninger på tværs af platformen.</p>
                </div>
                {isLoading ? (
                    <div className="h-96 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-300"/>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Tidspunkt</th>
                                    <th className="px-6 py-3">Bruger</th>
                                    <th className="px-6 py-3">Side</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                                {enrichedPageViews.map(view => (
                                    <tr key={view.id}>
                                        <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                            {view.timestamp?.toDate().toLocaleString('da-DK', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-3 font-semibold text-amber-900">{view.username}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-blue-700">{view.path}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {enrichedPageViews.length === 0 && (
                            <p className="p-12 text-center text-slate-400 italic">Ingen sidevisninger er registreret endnu.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminSystemPage;