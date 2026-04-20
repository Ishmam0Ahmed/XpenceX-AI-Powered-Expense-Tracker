import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: Success");
    return true;
  } catch (error: any) {
    console.warn("Firestore connection test info:", error.message);
    if (error?.message?.includes('the client is offline') || error?.message?.includes('unavailable')) {
      console.error("Please check your Firebase configuration or internet connection. Firestore is currently unavailable.");
    }
    return false;
  }
}
testConnection();
