import { adminFirestore } from '@/firebase/server-init';

// Helper to get Firestore instance on the server
export function getDb() {
  return adminFirestore;
}

