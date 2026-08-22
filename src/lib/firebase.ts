/// <reference types="vite/client" />

// Default project configuration for MediVerse AI (mediverse-ai-83b0ee)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyMediVerse83b0ee',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mediverse-ai-83b0ee.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mediverse-ai-83b0ee',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mediverse-ai-83b0ee.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '526899582918',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:526899582918:web:mediverseai83b0ee',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const isFirebaseInitialized = true;

// Lazy singletons
let appPromise: Promise<any> | null = null;
let authPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;
let storagePromise: Promise<any> | null = null;

export async function getFirebaseApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      if (!getApps().length) {
        return initializeApp(firebaseConfig);
      }
      return getApp();
    })();
  }
  return appPromise;
}

export async function getFirebaseAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getFirebaseApp();
      const { getAuth } = await import('firebase/auth');
      return getAuth(app);
    })();
  }
  return authPromise;
}

export async function getFirebaseFirestore() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = await getFirebaseApp();
      const { getFirestore } = await import('firebase/firestore');
      return getFirestore(app);
    })();
  }
  return dbPromise;
}

export async function getFirebaseStorage() {
  if (!storagePromise) {
    storagePromise = (async () => {
      const app = await getFirebaseApp();
      const { getStorage } = await import('firebase/storage');
      return getStorage(app);
    })();
  }
  return storagePromise;
}

// Fallback objects for backwards compatibility
export const app = {} as any;
export const auth = {} as any;
export const db = {} as any;
export const storage = {} as any;

// --- Auth Helpers ---

/**
 * Sign in using Firebase Google Popup Auth
 */
export async function signInWithGoogle() {
  try {
    const authInstance = await getFirebaseAuth();
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(authInstance, provider);
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
  const authInstance = await getFirebaseAuth();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  return await signInWithEmailAndPassword(authInstance, email, pass);
}

/**
 * Register a new user using Firebase Email and Password
 */
export async function registerWithFirebaseEmail(email: string, pass: string) {
  const authInstance = await getFirebaseAuth();
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  return await createUserWithEmailAndPassword(authInstance, email, pass);
}

/**
 * Send password reset email via Firebase
 */
export async function sendFirebasePasswordReset(email: string) {
  const authInstance = await getFirebaseAuth();
  const { sendPasswordResetEmail } = await import('firebase/auth');
  return await sendPasswordResetEmail(authInstance, email);
}

/**
 * Send email verification to Firebase user
 */
export async function sendFirebaseVerificationEmail(customUser?: any) {
  try {
    const authInstance = await getFirebaseAuth();
    const userToVerify = customUser || authInstance.currentUser;
    if (!userToVerify) {
      throw new Error('No authenticated Firebase user found to send verification email.');
    }
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(userToVerify);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase sendEmailVerification error:', error);
    throw error;
  }
}

/**
 * Reload current Firebase user and check emailVerified status
 */
export async function checkFirebaseEmailVerified(): Promise<boolean> {
  try {
    const authInstance = await getFirebaseAuth();
    if (!authInstance.currentUser) {
      return false;
    }
    // Reload user profile from Firebase servers to fetch fresh emailVerified flag
    await authInstance.currentUser.reload();
    return Boolean(authInstance.currentUser.emailVerified);
  } catch (error: any) {
    console.warn('Firebase check email verified error:', error);
    return false;
  }
}

/**
 * Apply email verification action code if user landed from email link
 */
export async function applyFirebaseActionCode(actionCode: string) {
  const authInstance = await getFirebaseAuth();
  const { applyActionCode } = await import('firebase/auth');
  return await applyActionCode(authInstance, actionCode);
}

/**
 * Logout from Firebase
 */
export async function logoutFirebase() {
  try {
    const authInstance = await getFirebaseAuth();
    const { signOut } = await import('firebase/auth');
    return await signOut(authInstance);
  } catch {
    // Graceful fallback if auth was never loaded
  }
}

// --- Firestore Database Helpers ---

/**
 * Save / sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(userId: string, userData: Record<string, any>) {
  try {
    const dbInstance = await getFirebaseFirestore();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userDocRef = doc(dbInstance, 'users', userId);
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
  try {
    const dbInstance = await getFirebaseFirestore();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const reportId = reportData.id || `rep_${Date.now()}`;
    const reportDocRef = doc(dbInstance, 'users', userId, 'reports', reportId);
    await setDoc(reportDocRef, {
      ...reportData,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save report to Firestore:', err);
  }
}

/**
 * Save / sync subscription and usage details to Firestore
 */
export async function syncSubscriptionToFirestore(userId: string, subscription: any, usageStatus?: any) {
  try {
    const dbInstance = await getFirebaseFirestore();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const subDocRef = doc(dbInstance, 'users', userId);
    await setDoc(subDocRef, {
      subscription,
      usageStatus: usageStatus || null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync subscription to Firestore:', err);
  }
}

/**
 * Upload medical document file to Firebase Storage
 */
export async function uploadMedicalDocument(userId: string, file: File | Blob, fileName: string): Promise<string | null> {
  try {
    const storageInstance = await getFirebaseStorage();
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storageInstance, `medical-records/${userId}/${Date.now()}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Could not upload file to Firebase Storage:', err);
    return null;
  }
}
