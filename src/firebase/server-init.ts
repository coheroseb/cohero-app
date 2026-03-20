import * as admin from 'firebase-admin';

/**
 * Initialiserer Firebase Admin SDK på serveren.
 * Bruger GOOGLE_SERVICE_ACCOUNT_JSON miljøvariablen hvis den findes,
 * ellers falder den tilbage på standard-legitimationsoplysninger (ADC).
 */
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  try {
    if (serviceAccountVar) {
      // Hvis vi har en JSON-streng i miljøvariablen
      const serviceAccount = JSON.parse(serviceAccountVar);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Tilføj databaseURL hvis du har problemer med at finde firestore
        // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    } else {
      // Standard initialisering (virker automatisk på Google Cloud / Firebase Hosting)
      return admin.initializeApp();
    }
  } catch (error) {
    console.error("FIREBASE ADMIN INIT ERROR:", error);
    // Sidste udvej: Initialiser uden parametre og håb på ADC
    return admin.initializeApp();
  }
}

const app = getAdminApp();

export const adminAuth = admin.auth(app);
export const adminFirestore = admin.firestore(app);
export const adminStorage = admin.storage(app);

// Legacy support
export const initializeServerFirebase = () => ({
  firestore: adminFirestore,
  auth: adminAuth,
  storage: adminStorage
});
