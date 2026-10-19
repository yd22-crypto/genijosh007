import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'leaderboard', 'test-connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network unavailable.');
      return false;
    }
    // Permissions error or doc not found is still an active connection response
    return true;
  }
}

export interface GameScoreRecord {
  id?: string;
  playerName: string;
  score: number;
  timeLeft: number;
  oxygenCollected: number;
  oxygenDelivered: number;
  plateletsCollected: number;
  wbcCollisions: number;
  isClear: boolean;
  createdAt: string;
  userId?: string;
}

export async function submitGameScore(record: Omit<GameScoreRecord, 'id'>): Promise<string> {
  const path = 'leaderboard';
  try {
    const docRef = await addDoc(collection(db, path), {
      playerName: record.playerName.slice(0, 30).trim() || '이름 없음',
      score: Math.max(0, Math.floor(record.score)),
      timeLeft: Math.max(0, Math.floor(record.timeLeft)),
      oxygenCollected: Math.max(0, record.oxygenCollected || 0),
      oxygenDelivered: Math.max(0, record.oxygenDelivered || 0),
      plateletsCollected: Math.max(0, record.plateletsCollected || 0),
      wbcCollisions: Math.max(0, record.wbcCollisions || 0),
      isClear: Boolean(record.isClear),
      createdAt: record.createdAt || new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getTopLeaderboard(count = 10): Promise<GameScoreRecord[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, path), orderBy('score', 'desc'), limit(count));
    const snapshot = await getDocs(q);
    const results: GameScoreRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as GameScoreRecord;
      results.push({
        id: d.id,
        playerName: data.playerName,
        score: data.score,
        timeLeft: data.timeLeft,
        oxygenCollected: data.oxygenCollected ?? 0,
        oxygenDelivered: data.oxygenDelivered ?? 0,
        plateletsCollected: data.plateletsCollected ?? 0,
        wbcCollisions: data.wbcCollisions ?? 0,
        isClear: data.isClear,
        createdAt: data.createdAt,
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
