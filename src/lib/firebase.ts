import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDrmdSL5As55VcNKtG67RAT6n6aTfgHAbg",
  authDomain: "leender-45106.firebaseapp.com",
  projectId: "leender-45106",
  storageBucket: "leender-45106.firebasestorage.app",
  messagingSenderId: "151481421423",
  appId: "1:151481421423:web:27aa48dce948d9f558479a",
  measurementId: "G-8SZ6H6X0DJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();
