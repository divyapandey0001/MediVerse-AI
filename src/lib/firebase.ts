/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';

// Default project configuration for MediVerse AI (mediverse-ai-83b0ee)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyMediVerse83b0ee',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mediverse-ai-83b0ee.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mediverse-ai-83b0ee',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mediverse-ai-83b0ee.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '526899582918',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:526899582918:web:mediverseai83b0ee',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let isFirebaseInitialized = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseInitialized = true;
} catch (error) {
  console.warn('Firebase initialization warning:', error);
  // Fallback instances to prevent crashes during bundle evaluation
  app = getApps()[0] || ({} as FirebaseApp);
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, storage, isFirebaseInitialized, firebaseConfig };

// --- Auth Helpers ---

/**
 * Sign in using Firebase Google Popup Auth
 */
export async function signInWithGoogle() {
  if (!auth?.app) {
    throw new Error('Firebase Auth is not initialized. Please verify your VITE_FIREBASE_API_KEY.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Sign in using Firebase Email and Password
 */
export async function signInWithFirebaseEmail(email: string, pass: string) {
  if (!auth?.app) {
    throw new Error('Firebase Auth is not initialized.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
}

/**
 * Register a new user using Firebase Email and Password
 */
export async function registerWithFirebaseEmail(email: string, pass: string) {
  if (!auth?.app) {
    throw new Error('Firebase Auth is not initialized.');
  }
  return await createUserWithEmailAndPassword(auth, email, pass);
}

/**
 * Send password reset email via Firebase
 */
export async function sendFirebasePasswordReset(email: string) {
  if (!auth?.app) {
    throw new Error('Firebase Auth is not initialized.');
  }
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Logout from Firebase
 */
export async function logoutFirebase() {
  if (!auth?.app) return;
  return await signOut(auth);
}

// --- Firestore Database Helpers ---

/**
 * Save / sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(userId: string, userData: Record<string, any>) {
  if (!db?.app) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

/**
 * Save lab report analysis to Firestore
 */
export async function saveReportToFirestore(userId: string, reportData: Record<string, any>) {
  if (!db?.app) return;
  try {
    const reportId = reportData.id || `rep_${Date.now()}`;
    const reportDocRef = doc(db, 'users', userId, 'reports', reportId);
    await setDoc(reportDocRef, {
      ...reportData,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save report to Firestore:', err);
  }
}

/**
 * Upload medical document file to Firebase Storage
 */
export async function uploadMedicalDocument(userId: string, file: File | Blob, fileName: string): Promise<string | null> {
  if (!storage?.app) return null;
  try {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `medical-records/${userId}/${Date.now()}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Could not upload file to Firebase Storage:', err);
    return null;
  }
}
