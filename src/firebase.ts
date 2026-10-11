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
  increment,
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
  type UserSubscription,
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
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
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

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Trader',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not sync user profile to Firestore:', error);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      syncUserProfile(currentUser);
    }
    callback(currentUser);
  });
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
    // Touch the user profile document with activity timestamp
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      lastScanAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAnalysisInFirestore(
  userId: string,
  analysis: TradingSignal
): Promise<void> {
  const path = `users/${userId}/analyses/${analysis.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'analyses', analysis.id);
    await updateDoc(docRef, { ...analysis });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
    // Update signal status based on journal entry outcome
    if (entry.signalId) {
      await updateAnalysisStatus(userId, entry.signalId, entry.outcome.toLowerCase() as 'pending' | 'win' | 'loss' | 'breakeven');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAnalysisStatus(
  userId: string,
  analysisId: string,
  status: 'pending' | 'win' | 'loss' | 'breakeven'
): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    const docRef = doc(db, 'users', userId, 'analyses', analysisId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteJournalEntry(
  userId: string,
  journalId: string
): Promise<void> {
  const path = `users/${userId}/journal/${journalId}`;
  const docRef = doc(db, 'users', userId, 'journal', journalId);
  try {
    let signalIdToReset: string | undefined;
    try {
      const entrySnap = await getDoc(docRef);
      if (entrySnap.exists()) {
        const entryData = entrySnap.data() as JournalEntry;
        signalIdToReset = entryData.signalId;
      }
    } catch (readErr) {
      console.warn('Could not read journal entry before deleting:', readErr);
    }

    // Permanently remove document from Firestore
    await deleteDoc(docRef);

    // Non-blocking status reset of linked signal if applicable
    if (signalIdToReset) {
      try {
        await updateAnalysisStatus(userId, signalIdToReset, 'pending');
      } catch (statusErr) {
        console.warn('Could not reset linked analysis status:', statusErr);
      }
    }
  } catch (error) {
    console.error('Firebase: Error deleting journal entry:', error);
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

export async function incrementSharedSignalView(shareId: string): Promise<void> {
  const path = `sharedSignals/${shareId}`;
  try {
    const docRef = doc(db, 'sharedSignals', shareId);
    await updateDoc(docRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.warn(`Could not increment view count for ${path}:`, error);
  }
}

export interface UserStrategySettings {
  userId: string;
  activeStrategies: string[];
}

export async function saveUserStrategies(userId: string, activeStrategies: string[]): Promise<void> {
  const path = `users/${userId}/settings/strategies`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'strategies');
    await setDoc(docRef, { userId, activeStrategies });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserStrategies(userId: string): Promise<string[] | null> {
  const path = `users/${userId}/settings/strategies`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'strategies');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data() as UserStrategySettings).activeStrategies;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Subscription Operations: /users/{userId}/subscription/status
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const path = `users/${userId}/subscription/status`;
  try {
    const docRef = doc(db, 'users', userId, 'subscription', 'status');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserSubscription;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserSubscription(userId: string, subscription: UserSubscription): Promise<void> {
  const path = `users/${userId}/subscription/status`;
  try {
    const docRef = doc(db, 'users', userId, 'subscription', 'status');
    await setDoc(docRef, subscription);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpdateUserSubscription(
  userId: string,
  plan: 'trial' | 'monthly',
  days: number = 30
): Promise<void> {
  const path = `users/${userId}/subscription/status`;
  try {
    const docRef = doc(db, 'users', userId, 'subscription', 'status');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await setDoc(
      docRef,
      {
        userId,
        plan,
        status: 'active',
        expiresAt,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface RegisteredUserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLoginAt?: string;
  lastScanAt?: string;
  lastActiveAt?: string;
  createdAt?: string;
  subscription?: UserSubscription | null;
  hasPaidTransaction?: boolean;
}

export async function getAdminUsersList(): Promise<RegisteredUserRecord[]> {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);

    // Fetch transactions to identify accounts with completed payments
    const finishedUserIds = new Set<string>();
    try {
      const txSnap = await getDocs(query(collection(db, 'transactions')));
      txSnap.forEach((d) => {
        const tx = d.data();
        if (tx.status === 'finished' && tx.userId) {
          finishedUserIds.add(tx.userId);
        }
      });
    } catch (e) {
      console.warn('Could not check transactions for premium status:', e);
    }

    const users: RegisteredUserRecord[] = [];
    await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        let sub: UserSubscription | null = null;
        try {
          const subSnap = await getDoc(doc(db, 'users', d.id, 'subscription', 'status'));
          if (subSnap.exists()) {
            sub = subSnap.data() as UserSubscription;
          }
        } catch (e) {
          console.warn(`Could not fetch subscription for user ${d.id}:`, e);
        }

        const hasPaid = finishedUserIds.has(d.id);

        users.push({
          uid: d.id,
          email: data.email || 'Trader',
          displayName: data.displayName || '',
          photoURL: data.photoURL || '',
          lastLoginAt: data.lastLoginAt || '',
          lastScanAt: data.lastScanAt || '',
          lastActiveAt: data.lastActiveAt || '',
          createdAt: data.createdAt || '',
          subscription: sub,
          hasPaidTransaction: hasPaid,
        });
      })
    );

    // Sort users by latest active / login date
    users.sort((a, b) => {
      const tA = new Date(a.lastActiveAt || a.lastLoginAt || a.createdAt || 0).getTime();
      const tB = new Date(b.lastActiveAt || b.lastLoginAt || b.createdAt || 0).getTime();
      return tB - tA;
    });

    return users;
  } catch (error) {
    console.warn('Could not list users from Firestore:', error);
    return [];
  }
}

export interface AdminTransactionRecord {
  id: string;
  userId?: string;
  status: string;
  amount: number | string;
  currency: string;
  createdAt: string;
}

export async function getAdminTransactionsList(): Promise<AdminTransactionRecord[]> {
  try {
    const q = query(collection(db, 'transactions'));
    const snapshot = await getDocs(q);
    const list: AdminTransactionRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        userId: data.userId || '',
        status: data.status || 'pending',
        amount: Number(data.price_amount ?? data.amount ?? 0),
        currency: data.pay_currency || data.currency || 'USD',
        createdAt: data.createdAt || '',
      });
    });
    return list;
  } catch (error) {
    console.warn('Could not list transactions:', error);
    return [];
  }
}

export async function getAdminSharedSignalsCount(): Promise<number> {
  try {
    const q = query(collection(db, 'sharedSignals'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}

export async function getAdminAllAnalyses(userUids: string[]): Promise<TradingSignal[]> {
  try {
    const allSignals: TradingSignal[] = [];
    for (const uid of userUids) {
      if (!uid) continue;
      try {
        const q = query(collection(db, 'users', uid, 'analyses'));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          allSignals.push(d.data() as TradingSignal);
        });
      } catch (err) {
        console.warn(`Could not fetch analyses for user ${uid}:`, err);
      }
    }
    allSignals.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return allSignals;
  } catch (error) {
    console.warn('Error fetching all admin analyses:', error);
    return [];
  }
}

export async function getAdminAllJournalEntries(userUids: string[]): Promise<JournalEntry[]> {
  try {
    const allEntries: JournalEntry[] = [];
    for (const uid of userUids) {
      if (!uid) continue;
      try {
        const q = query(collection(db, 'users', uid, 'journal'));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          allEntries.push(d.data() as JournalEntry);
        });
      } catch (err) {
        console.warn(`Could not fetch journal for user ${uid}:`, err);
      }
    }
    allEntries.sort((a, b) => new Date(b.loggedAt || 0).getTime() - new Date(a.loggedAt || 0).getTime());
    return allEntries;
  } catch (error) {
    console.warn('Error fetching all admin journal entries:', error);
    return [];
  }
}

