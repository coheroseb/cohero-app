import { NextResponse } from 'next/server';
import { initializeServerFirebase } from '@/firebase/server-init';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const isCron = searchParams.get('cron') === 'true';

  // 1. SINGLE URL CHECK (Live lookup for "Gemte kilder")
  if (targetUrl) {
    console.log(`Attempting to fetch status for URL: ${targetUrl}`); // Added logging
    try {
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fetch failed for ${targetUrl} with status ${response.status}: ${errorText}`); // Detailed error logging
        throw new Error(`Hentning fejlede (${response.status})`);
      }
      
      const xmlText = await response.text();
      const jsonObj = parser.parse(xmlText);
      
      const status = jsonObj.Dokument?.Meta?.Status || 'Ukendt';
      return NextResponse.json({ success: true, status });
    } catch (e: any) {
      console.error(`Error processing URL ${targetUrl}:`, e); // Catch and log specific errors
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  // 2. BULK CHECK (Admin/Cron job)
  if (isCron) {
    try {
      const { firestore } = initializeServerFirebase();
      const lawsSnap = await firestore.collection('laws').get();
      
      if (lawsSnap.empty) {
        return NextResponse.json({ success: true, message: 'Ingen love fundet.', results: [] });
      }

      const updatePromises = lawsSnap.docs.map(async (docSnapshot) => {
        const law = docSnapshot.data();
        const xmlUrl = law.xmlUrl; // Assuming xmlUrl field exists
        if (!xmlUrl) return { id: docSnapshot.id, status: 'Ingen URL' };

        console.log(`Cron job: Checking status for law ID ${docSnapshot.id} at URL: ${xmlUrl}`); // Added logging for cron
        try {
          const response = await fetch(xmlUrl, { cache: 'no-store' });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Cron job fetch failed for ${xmlUrl} with status ${response.status}: ${errorText}`);
            return { id: docSnapshot.id, status: `Fejl (${response.status})` };
          }
          const xmlText = await response.text();
          const jsonObj = parser.parse(xmlText);
          const status = jsonObj.Dokument?.Meta?.Status || 'Ukendt';
          
          return { id: docSnapshot.id, status };
        } catch (e: any) {
          console.error(`Cron job error for law ID ${docSnapshot.id} at URL ${xmlUrl}:`, e); // Catch and log specific errors
          return { id: docSnapshot.id, status: `Fejl (${e.message})` };
        }
      });

      const results = await Promise.all(updatePromises);
      return NextResponse.json({ success: true, message: 'Status checks completed.', results });

    } catch (e: any) {
      console.error('Error in cron job /api/laws/check-status:', e);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Ugyldig anmodning.' }, { status: 400 });
}
