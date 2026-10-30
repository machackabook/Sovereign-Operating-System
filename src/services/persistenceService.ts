import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

const STORAGE_KEY = 'user_ui_config';

export const saveLocalState = (state: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getLocalState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};

export const syncToFirestore = async (state: any) => {
  if (!auth.currentUser) return;
  const stateRef = doc(db, 'userStates', auth.currentUser.uid);
  await setDoc(stateRef, { ...state, userId: auth.currentUser.uid, updatedAt: new Date().toISOString() });
};

export const listenToFirestore = (callback: (state: any) => void) => {
  if (!auth.currentUser) return null;
  const stateRef = doc(db, 'userStates', auth.currentUser.uid);
  return onSnapshot(stateRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};
