
import { useState, useMemo } from 'react';
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
