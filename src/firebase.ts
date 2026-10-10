import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  collection,
  query,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  OperationType,
  type FirestoreErrorInfo,
  type TradingSignal,
  type SharedSignal,
  type ChatMessage,
  type DailyUsage,
  type WatchlistItem,
  type JournalEntry,
  ADMIN_EMAIL,
} from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection to Firestore as required by system guidelines
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing.');
    }
  }
}
testConnection();

// Structured Firestore error handler
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if a user is the administrator of the app
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Helper to get formatted current UTC date key YYYY-MM-DD
export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

// Auth operations
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Firestore operations for /users/{userId}/analyses/{analysisId}
export async function saveAnalysisToFirestore(
  userId: string,
  analysis: TradingSignal
): Promise<void> {
  const path = `users/${userId}/analyses/${analysis.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'analyses', analysis.id);
    await setDoc(docRef, analysis);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAnalysisChatInFirestore(
  userId: string,
  analysisId: string,
  chatHistory: ChatMessage[]
): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    const docRef = doc(db, 'users', userId, 'analyses', analysisId);
    await updateDoc(docRef, { chatHistory });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAnalysisFromFirestore(
  userId: string,
  analysisId: string
): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    const docRef = doc(db, 'users', userId, 'analyses', analysisId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserAnalyses(
  userId: string,
  onData: (analyses: TradingSignal[]) => void,
  onError?: (error: unknown) => void
) {
  const path = `users/${userId}/analyses`;
  const q = query(collection(db, 'users', userId, 'analyses'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: TradingSignal[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as TradingSignal);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getUserAnalyses(userId: string): Promise<TradingSignal[]> {
  const path = `users/${userId}/analyses`;
  try {
    const q = query(collection(db, 'users', userId, 'analyses'));
    const snapshot = await getDocs(q);
    const items: TradingSignal[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as TradingSignal);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Daily Usage Operations for Anti-Overtrading Guard: /users/{userId}/dailyScans/{dateId}
export function subscribeToDailyUsage(
  userId: string,
  onData: (usage: DailyUsage | null) => void,
  onError?: (error: unknown) => void
) {
  const todayKey = getTodayDateKey();
  const path = `users/${userId}/dailyScans/${todayKey}`;
  const docRef = doc(db, 'users', userId, 'dailyScans', todayKey);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as DailyUsage);
      } else {
        onData(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function recordDailyScan(userId: string): Promise<number> {
  const todayKey = getTodayDateKey();
  const path = `users/${userId}/dailyScans/${todayKey}`;
  const docRef = doc(db, 'users', userId, 'dailyScans', todayKey);

  try {
    const snap = await getDoc(docRef);
    let newCount = 1;
    if (snap.exists()) {
      const data = snap.data() as DailyUsage;
      newCount = (data.scanCount || 0) + 1;
    }
    const payload: DailyUsage = {
      userId,
      date: todayKey,
      scanCount: newCount,
      lastScanAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
    return newCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetDailyScansForUser(userId: string): Promise<void> {
  const todayKey = getTodayDateKey();
  const path = `users/${userId}/dailyScans/${todayKey}`;
  const docRef = doc(db, 'users', userId, 'dailyScans', todayKey);
  try {
    await setDoc(docRef, {
      userId,
      date: todayKey,
      scanCount: 0,
      lastScanAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Watchlist Operations: /users/{userId}/watchlist/{pairId}
export function subscribeToWatchlist(
  userId: string,
  onData: (items: WatchlistItem[]) => void,
  onError?: (error: unknown) => void
) {
  const path = `users/${userId}/watchlist`;
  const q = query(collection(db, 'users', userId, 'watchlist'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as WatchlistItem);
      });
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addToWatchlist(
  userId: string,
  pair: string,
  category = 'Major',
  alertsEnabled = true
): Promise<void> {
  // Normalize pair id (e.g. 'EUR-USD' or 'EURUSD')
  const cleanId = pair.replace('/', '_').toUpperCase();
  const path = `users/${userId}/watchlist/${cleanId}`;
  const docRef = doc(db, 'users', userId, 'watchlist', cleanId);

  try {
    const item: WatchlistItem = {
      id: cleanId,
      userId,
      pair: pair.toUpperCase(),
      category,
      alertsEnabled,
      addedAt: new Date().toISOString(),
    };
    await setDoc(docRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleWatchlistAlert(
  userId: string,
  pairIdOrPair: string,
  alertsEnabled: boolean
): Promise<void> {
  const cleanId = pairIdOrPair.replace('/', '_').toUpperCase();
  const path = `users/${userId}/watchlist/${cleanId}`;
  const docRef = doc(db, 'users', userId, 'watchlist', cleanId);
  try {
    await updateDoc(docRef, { alertsEnabled });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeFromWatchlist(
  userId: string,
  pairIdOrPair: string
): Promise<void> {
  const cleanId = pairIdOrPair.replace('/', '_').toUpperCase();
  const path = `users/${userId}/watchlist/${cleanId}`;
  const docRef = doc(db, 'users', userId, 'watchlist', cleanId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Journal Operations: /users/{userId}/journal/{journalId}
export function subscribeToJournalEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError?: (error: unknown) => void
) {
  const path = `users/${userId}/journal`;
  const q = query(collection(db, 'users', userId, 'journal'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as JournalEntry);
      });
      items.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveJournalEntry(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  const path = `users/${userId}/journal/${entry.id}`;
  const docRef = doc(db, 'users', userId, 'journal', entry.id);
  try {
    await setDoc(docRef, entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteJournalEntry(
  userId: string,
  journalId: string
): Promise<void> {
  const path = `users/${userId}/journal/${journalId}`;
  const docRef = doc(db, 'users', userId, 'journal', journalId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Public Shared Signals: /sharedSignals/{shareId}
export async function publishSharedSignal(
  signal: TradingSignal,
  authorName?: string
): Promise<string> {
  const cleanId = (signal.id || 'signal').replace(/[^a-zA-Z0-9_-]/g, '_');
  const shareId = `share_${cleanId}_${Date.now().toString(36)}`;
  const path = `sharedSignals/${shareId}`;

  const currentUid = auth.currentUser?.uid || signal.userId || 'anonymous_trader';

  const payload: SharedSignal = {
    id: shareId,
    userId: currentUid,
    authorName: authorName || auth.currentUser?.displayName || 'Verified Prop Trader',
    pair: signal.pair || 'EUR/USD',
    direction: signal.direction || 'BUY',
    timeframe: signal.timeframe || '1H',
    analysisType: signal.analysisType || 'Price Action & Liquidity Confluence',
    entryPrice: signal.entryPrice || '1.0850',
    stopLoss: signal.stopLoss || '1.0800',
    tp1: signal.tp1 || '1.0950',
    tp2: signal.tp2 || '',
    tp3: signal.tp3 || '',
    riskReward: signal.riskReward || '1:2.5',
    confidence: signal.confidence || 85,
    marketStructure: signal.marketStructure || 'Institutional liquidity structure validated.',
    supportResistance: signal.supportResistance || 'Major horizontal supply/demand level.',
    marketPsychology: signal.marketPsychology || 'Trapped counter-trend retail orders provide immediate momentum.',
    candlestickConfirmation: signal.candlestickConfirmation || 'Strong rejection wick with high conviction close.',
    vsaSignalType: signal.vsaSignalType || '',
    vsaExplanation: signal.vsaExplanation || '',
    imageUrl: signal.imageUrl && signal.imageUrl.length < 500000 ? signal.imageUrl : undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'sharedSignals', shareId);
    await setDoc(docRef, payload);
    return shareId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getSharedSignalById(shareId: string): Promise<SharedSignal | null> {
  const path = `sharedSignals/${shareId}`;
  try {
    const docRef = doc(db, 'sharedSignals', shareId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SharedSignal;
    }
    return null;
  } catch (error) {
    console.warn(`Could not read shared signal from ${path}:`, error);
    return null;
  }
}

