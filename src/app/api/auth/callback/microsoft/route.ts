
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore as firestore, adminAuth as auth } from '@/firebase/server-init';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=' + error, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=no_code', req.url));
  }

  // 1. Get current Cohero User from session
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/auth?redirect=/settings?tab=integrations', req.url));
  }

  let decodedToken;
  try {
    decodedToken = await auth().verifyIdToken(sessionCookie);
  } catch (e) {
    return NextResponse.redirect(new URL('/auth?redirect=/settings?tab=integrations', req.url));
  }

  const userId = decodedToken.uid;

  // 2. Exchange code for tokens
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const redirectUri = process.env.AZURE_REDIRECT_URI || 'https://cohero.dk/api/auth/callback/microsoft';

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        scope: 'Notes.Read offline_access User.Read',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Token exchange failed');

    const expiresAt = Date.now() + (data.expires_in * 1000);

    // 3. Store tokens in Firestore
    await firestore.collection('users').doc(userId).update({
      oneNoteAuth: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt,
        connectedAt: new Date().toISOString(),
      }
    });

    return NextResponse.redirect(new URL('/settings?tab=integrations&success=onenote_connected', req.url));
  } catch (err: any) {
    console.error("Microsoft Auth Callback Error:", err);
    return NextResponse.redirect(new URL('/settings?tab=integrations&error=' + encodeURIComponent(err.message), req.url));
  }
}
