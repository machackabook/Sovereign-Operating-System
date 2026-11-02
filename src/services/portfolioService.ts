import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CryptoHolding {
  symbol: string;
  amount: number;
}

export interface CryptoAlert {
  id: string;
  symbol: string;
  threshold: number;
  condition: 'above' | 'below';
  triggered: boolean;
}

export const portfolioService = {
  async getPortfolio(userId: string): Promise<CryptoHolding[]> {
    const docRef = doc(db, 'portfolios', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().holdings || [];
    }
    return [];
  },

  async updateHolding(userId: string, holdings: CryptoHolding[]) {
    const docRef = doc(db, 'portfolios', userId);
    await setDoc(docRef, { holdings, updatedAt: new Date().toISOString() }, { merge: true });
  },

  async getPrices(): Promise<Record<string, { usd: number }>> {
    const response = await fetch('/api/finance/crypto/prices');
    if (!response.ok) throw new Error('Failed to fetch prices');
    return response.json();
  },

  async getAlerts(userId: string): Promise<CryptoAlert[]> {
    const docRef = doc(db, 'portfolios', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().alerts || [];
    }
    return [];
  },

  async updateAlerts(userId: string, alerts: CryptoAlert[]) {
    const docRef = doc(db, 'portfolios', userId);
    await setDoc(docRef, { alerts, updatedAt: new Date().toISOString() }, { merge: true });
  }
};
