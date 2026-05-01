
import { adminFirestore as firestore } from '@/firebase/server-init';

const MICROSOFT_GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

export interface OneNoteNotebook {
  id: string;
  displayName: string;
  lastModifiedDateTime: string;
}

export interface OneNotePage {
  id: string;
  title: string;
  contentUrl: string;
  lastModifiedDateTime: string;
}

export async function getMicrosoftAccessToken(userId: string): Promise<string | null> {
  const userDoc = await firestore.collection('users').doc(userId).get();
  const data = userDoc.data();
  
  if (!data?.oneNoteAuth) return null;

  const { accessToken, expiresAt, refreshToken } = data.oneNoteAuth;

  // Check if expired
  if (Date.now() > expiresAt) {
    return refreshMicrosoftToken(userId, refreshToken);
  }

  return accessToken;
}

async function refreshMicrosoftToken(userId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("Missing Azure credentials in environment");
    return null;
  }

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'Notes.Read offline_access',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Failed to refresh token');

    const expiresAt = Date.now() + (data.expires_in * 1000);
    
    await firestore.collection('users').doc(userId).update({
      'oneNoteAuth.accessToken': data.access_token,
      'oneNoteAuth.refreshToken': data.refresh_token,
      'oneNoteAuth.expiresAt': expiresAt,
    });

    return data.access_token;
  } catch (error) {
    console.error("Error refreshing Microsoft token:", error);
    return null;
  }
}

export async function listNotebooks(accessToken: string): Promise<OneNoteNotebook[]> {
  const response = await fetch(`${MICROSOFT_GRAPH_ENDPOINT}/me/onenote/notebooks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  return data.value || [];
}

export async function listPagesInNotebook(accessToken: string, notebookId: string): Promise<OneNotePage[]> {
  // Simplification: fetching all pages for the notebook. 
  // In reality, OneNote structure is Notebook -> Section -> Page
  const response = await fetch(`${MICROSOFT_GRAPH_ENDPOINT}/me/onenote/notebooks/${notebookId}/pages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  return data.value || [];
}

export async function getPageContent(accessToken: string, pageId: string): Promise<string> {
  const response = await fetch(`${MICROSOFT_GRAPH_ENDPOINT}/me/onenote/pages/${pageId}/content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.text();
}

export async function syncOneNoteToCohero(userId: string, notebookId: string) {
  const token = await getMicrosoftAccessToken(userId);
  if (!token) throw new Error("Not authenticated with OneNote");

  const pages = await listPagesInNotebook(token, notebookId);
  
  const batch = firestore.batch();
  const notesCol = firestore.collection('users').doc(userId).collection('onenote_notes');

  for (const page of pages) {
    const content = await getPageContent(token, page.id);
    const docRef = notesCol.doc(page.id);
    
    batch.set(docRef, {
      title: page.title,
      content: content, // HTML content from OneNote
      lastModified: page.lastModifiedDateTime,
      syncedAt: new Date().toISOString(),
      notebookId
    }, { merge: true });
  }

  await batch.commit();
}
