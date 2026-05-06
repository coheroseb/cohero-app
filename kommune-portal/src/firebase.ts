import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAc9loZEcoQ4u0umlkioccfzp1kD0YURtI",
  authDomain: "studio-7870211338-fe921.firebaseapp.com",
  projectId: "studio-7870211338-fe921",
  storageBucket: "studio-7870211338-fe921.firebasestorage.app",
  messagingSenderId: "815145067598",
  appId: "1:815145067598:web:84e929ee06f58e67858f1f",
  measurementId: "G-EXS2X5PXQ2"
};

const app = initializeApp(firebaseConfig);
const databaseId = 'cohero-database';

let firestore;
try {
  firestore = initializeFirestore(app, { 
    ignoreUndefinedProperties: true
  }, databaseId);
} catch (e) {
  firestore = getFirestore(app, databaseId);
}

export { firestore };
