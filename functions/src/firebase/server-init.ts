import * as admin from 'firebase-admin';

/**
 * Initialiserer Firebase Admin SDK på serveren.
 * Bruger GOOGLE_SERVICE_ACCOUNT_JSON miljøvariablen hvis den findes,
 * ellers falder den tilbage på standard-legitimationsoplysninger (ADC).
 */
function getAdminApp() {
  const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT;
  const appName = 'cohero';
  
  const existingApp = admin.apps.find(a => a?.name === appName);
  if (existingApp) return existingApp;

  try {
    if (serviceAccountVar) {
      let sanitizedJson = serviceAccountVar.trim();
      if (sanitizedJson.startsWith("'") && sanitizedJson.endsWith("'")) sanitizedJson = sanitizedJson.slice(1, -1);
      else if (sanitizedJson.startsWith('"') && sanitizedJson.endsWith('"')) sanitizedJson = sanitizedJson.slice(1, -1);

      const serviceAccount = JSON.parse(sanitizedJson);

      // Ensure private key is correctly formatted with actual newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      if (!process.env.GCLOUD_PROJECT) {
          process.env.GCLOUD_PROJECT = serviceAccount.project_id;
      }

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: "studio-7870211338-fe921.firebasestorage.app"
      }, appName);

    } else {
      console.warn("[Firebase Admin] service account JSON is missing. Trying default app.");
      if (admin.apps.length > 0) return admin.apps[0]!;
      return admin.initializeApp();
    }
  } catch (error: any) {
    console.error("FIREBASE ADMIN INIT ERROR:", error.message);
    if (admin.apps.length > 0) return admin.apps[0]!;
    throw error;
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
