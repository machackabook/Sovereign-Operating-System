import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with auto-detect long polling and network resilience
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;

/**
 * Unmasks anonymous users by guaranteeing an active Firebase credential
 * and provisioning a deterministic session identity with clear elevation paths.
 */
export async function ensureAuthenticatedSession(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign-in notice (offline fallback):', err);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });
}

export async function unmaskAnonymousIdentity(): Promise<{
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email: string | null;
  elevationAvailable: boolean;
}> {
  let user = auth.currentUser;
  if (!user) {
    user = await ensureAuthenticatedSession();
  }

  if (user) {
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      displayName: user.displayName || (user.isAnonymous ? `Unmasked-Anon-${user.uid.slice(0, 8)}` : 'Authenticated Operative'),
      email: user.email || (user.isAnonymous ? 'anonymous@nexus.system' : null),
      elevationAvailable: user.isAnonymous,
    };
  }

  // Local fallback if Firebase service is blocked
  const localId = `unmasked-local-${Math.random().toString(36).slice(2, 10)}`;
  return {
    uid: localId,
    isAnonymous: true,
    displayName: `Local-Operative-${localId.slice(-6)}`,
    email: 'local@nexus.system',
    elevationAvailable: true,
  };
}
