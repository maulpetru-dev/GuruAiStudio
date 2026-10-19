import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

// Official Web Firebase configuration provided for GuruAI Studio
export const firebaseConfig = {
  apiKey: "AIzaSyC777bm0O84jcrOXD9xbutCSqWDyMARCMI",
  authDomain: "guruai-studio.firebaseapp.com",
  projectId: "guruai-studio",
  storageBucket: "guruai-studio.firebasestorage.app",
  messagingSenderId: "1001339985030",
  appId: "1:1001339985030:web:63d473bac01a26c6484507",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
};
