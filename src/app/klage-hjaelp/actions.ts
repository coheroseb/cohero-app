
'use server';

import { callFirebaseFlow } from '@/app/actions';

export interface DraftComplaintInput {
  analysisResult: any;
  userProfile?: any;
}

export async function draftComplaintAction(input: DraftComplaintInput) {
  try {
    // We'll use a specific prompt/flow for drafting the formal complaint
    // Since we don't have a dedicated flow yet, we can use a generic one or define it here
    // For now, let's assume we have a flow 'draftComplaintFlow'
    const result = await callFirebaseFlow('complaintDraft', {
        analysisResult: input.analysisResult,
        institution: input.userProfile?.institution || 'Institutionen',
        profession: input.userProfile?.profession || 'Uddannelsen',
        moduleName: input.analysisResult.moduleName || 'Modulet'
    });
    return result;
  } catch (error: any) {
    console.error('Error drafting complaint:', error);
    throw new Error(error.message || 'Kunne ikke generere klageudkast.');
  }
}
