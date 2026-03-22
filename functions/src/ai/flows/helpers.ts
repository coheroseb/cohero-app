// @ts-nocheck
import * as admin from 'firebase-admin';

// Helper to initialize and get Firestore instance on the server
export function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}
