
import { useState, useMemo, useEffect } from 'react';
import { lawEngine } from './core';
import { LawReference, LawSituation } from './types';

export const useLawSearch = (query: string) => {
    return useMemo(() => lawEngine.searchLaws(query), [query]);
};

export const useLawDetails = (id?: string) => {
    return useMemo(() => id ? lawEngine.getLawById(id) : undefined, [id]);
};

export const useLawRecommendations = (instName?: string, instType?: string) => {
    return useMemo(() => (instName && instType) ? lawEngine.recommendLawsForInstitution(instName, instType) : [], [instName, instType]);
};

export const useSituationLaws = (situationId?: string) => {
    return useMemo(() => situationId ? lawEngine.getSuggestedLawsForSituation(situationId) : [], [situationId]);
};

export const useLawEngine = () => {
    return lawEngine;
};

export const useParagraph = (lawId?: string, paragraphNumber?: string) => {
    const [para, setPara] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPara = async () => {
            if (!lawId || !paragraphNumber) return;
            setLoading(true);
            const { lawFetcher } = await import('./fetcher');
            const result = await lawFetcher.getParagraph(lawId, paragraphNumber);
            setPara(result);
            setLoading(false);
        };
        fetchPara();
    }, [lawId, paragraphNumber]);

    return { paragraph: para, loading };
};
