
'use server';

async function callFirebaseFlow(flowName: string, data: any) {
  const adminSecret = process.env.CRON_SECRET || "dev-secret-123";
  const url = `https://runaiflow-7pguetq4hq-uc.a.run.app/${flowName}`; 
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminSecret}`
    },
    body: JSON.stringify(data),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Flow ${flowName} failed:`, errorBody);
    return { error: 'Flow failed', details: errorBody };
  }

  return response.json();
}

export async function getLawContentAction(input: any) { 
    return callFirebaseFlow('getLawContentFlow', input); 
}

export async function analyzeParagraphAction(input: any) {
    return callFirebaseFlow('analyzeParagraphFlow', input);
}

export async function semanticLawSearchAction(query: string, lawId?: string, documentData?: any) {
    return callFirebaseFlow('semanticLawSearchFlow', { query, lawId, documentData });
}

export async function fetchLawTimeline(uniqueDocumentId: string) {
    // These are currently mocked in the original action as well or call simple endpoints
    return []; 
}

export async function fetchRelatedDocumentLinks(uniqueDocumentId: string) {
    return [];
}

export async function fetchRelatedDecisions(uniqueDocumentId: string) {
    return [];
}

export async function fetchOmbudsmandReports(uniqueDocumentId: string) {
    return [];
}
