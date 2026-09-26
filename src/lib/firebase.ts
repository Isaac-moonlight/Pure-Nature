import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
  FirestoreError,
  Unsubscribe,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import type { Order, WaiterCall, OrderStatus } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target database ID: use configured or default
const dbId = (firebaseConfigData as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Local fallback keys & broadcast channel for zero-latency instant sync across tabs and windows
const LOCAL_ORDERS_KEY = 'pn_orders_storage_v3';
const LOCAL_CALLS_KEY = 'pn_calls_storage_v3';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pure_nature_channel_v3')
  : null;

// Recursively clean all objects so Firestore never rejects undefined values
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null) return null as unknown as T;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = '';
      }
    }
    return cleaned as unknown as T;
  }
  return data;
}

export function getLocalOrders(): Order[] {
  try {
    const data = localStorage.getItem(LOCAL_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // quota safe
  }
}

export function getLocalCalls(): WaiterCall[] {
  try {
    const data = localStorage.getItem(LOCAL_CALLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalCalls(calls: WaiterCall[]) {
  try {
    localStorage.setItem(LOCAL_CALLS_KEY, JSON.stringify(calls));
  } catch {
    // quota safe
  }
}

// Dispatches internal event for instant reactivity across entire app
function emitLocalUpdate(type: 'orders' | 'calls') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`pure_nature_${type}_updated`));
    broadcastChannel?.postMessage({ type });
  }
}

/**
 * Real-time listener for all kitchen orders (combines Firestore with zero-latency local & multi-tab sync)
 */
export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void
): Unsubscribe {
  // 1. Immediate emission from cache so UI never waits and shows existing orders
  const initial = getLocalOrders();
  if (initial.length > 0) {
    onUpdate(initial);
  }

  // 2. In-memory & Cross-tab instant reactivity
  const handleLocalEvent = () => {
    onUpdate(getLocalOrders());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pure_nature_orders_updated', handleLocalEvent);
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_ORDERS_KEY) handleLocalEvent();
    });
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'orders') {
        handleLocalEvent();
      } else if (event.data?.type === 'calls') {
        window.dispatchEvent(new CustomEvent('pure_nature_calls_updated'));
      }
    };
  }

  // 3. Firestore onSnapshot real-time listener
  let unsubscribeFirestore: Unsubscribe = () => {};

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, limit(200));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreOrders.push({
            id: docSnap.id,
            tableNumber: Number(data.tableNumber) || 1,
            customerName: data.customerName || 'Client',
            customerPhone: data.customerPhone || '',
            items: data.items || [],
            totalAmount: Number(data.totalAmount) || 0,
            status: (data.status as OrderStatus) || 'pending',
            paymentMethod: data.paymentMethod || 'cash_table',
            paymentStatus: data.paymentStatus || 'pending',
            specialNotes: data.specialNotes || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: data.updatedAt,
          });
        });

        // Merge with local orders, giving precedence to Firestore data
        const localOrders = getLocalOrders();
        const mergedMap = new Map<string, Order>();

        // Seed with local orders
        localOrders.forEach((o) => mergedMap.set(o.id, o));

        // Overwrite or add Firestore orders
        firestoreOrders.forEach((fo) => {
          mergedMap.set(fo.id, fo);
        });

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        saveLocalOrders(mergedList);
        onUpdate(mergedList);
      },
      (err: FirestoreError) => {
        console.warn('Firestore orders sync note (fallback to local cache):', err.message);
        onUpdate(getLocalOrders());
      }
    );
  } catch (err) {
    console.warn('Firestore init note:', err);
    onUpdate(getLocalOrders());
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pure_nature_orders_updated', handleLocalEvent);
    }
    unsubscribeFirestore();
  };
}

/**
 * Real-time listener for waiter calls
 */
export function subscribeToWaiterCalls(
  onUpdate: (calls: WaiterCall[]) => void
): Unsubscribe {
  const initial = getLocalCalls();
  if (initial.length > 0) {
    onUpdate(initial);
  }

  const handleLocalCallsEvent = () => {
    onUpdate(getLocalCalls());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pure_nature_calls_updated', handleLocalCallsEvent);
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_CALLS_KEY) handleLocalCallsEvent();
    });
  }

  let unsubscribeFirestore: Unsubscribe = () => {};

  try {
    const callsCol = collection(db, 'waiterCalls');
    const q = query(callsCol, limit(100));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const firestoreCalls: WaiterCall[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreCalls.push({
            id: docSnap.id,
            tableNumber: Number(data.tableNumber) || 1,
            reason: data.reason || 'service',
            status: data.status || 'pending',
            notes: data.notes || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            resolvedAt: data.resolvedAt,
          });
        });

        const localCalls = getLocalCalls();
        const mergedMap = new Map<string, WaiterCall>();
        localCalls.forEach((c) => mergedMap.set(c.id, c));
        firestoreCalls.forEach((c) => mergedMap.set(c.id, c));

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        saveLocalCalls(mergedList);
        onUpdate(mergedList);
      },
      (err) => {
        console.warn('Firestore calls sync note:', err);
        onUpdate(getLocalCalls());
      }
    );
  } catch (err) {
    console.warn('Firestore calls init error:', err);
    onUpdate(getLocalCalls());
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pure_nature_calls_updated', handleLocalCallsEvent);
    }
    unsubscribeFirestore();
  };
}

/**
 * Create a new order in Firestore + instantaneous local/broadcast dispatch
 */
export async function createOrderInFirestore(order: Omit<Order, 'id'>): Promise<string> {
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100);
  const newOrder: Order = {
    ...order,
    id: orderId,
    tableNumber: Number(order.tableNumber),
    customerPhone: order.customerPhone || '',
    specialNotes: order.specialNotes || '',
    createdAt: order.createdAt || Date.now(),
  };

  // Instant local save & broadcast (0ms UI latency)
  const existing = getLocalOrders();
  saveLocalOrders([newOrder, ...existing]);
  emitLocalUpdate('orders');

  // Firestore persistence with clean data (no undefined fields)
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const cleanedPayload = cleanForFirestore({
      ...newOrder,
      serverCreatedAt: serverTimestamp(),
    });
    await setDoc(orderDocRef, cleanedPayload);
  } catch (error) {
    console.error('Firestore order write error:', error);
  }

  return orderId;
}

/**
 * Update order status (kitchen workflow)
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
  const now = Date.now();
  // Update local cache immediately
  const locals = getLocalOrders().map((o) =>
    o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o
  );
  saveLocalOrders(locals);
  emitLocalUpdate('orders');

  // Firestore update
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      updatedAt: now,
    });
  } catch (error) {
    console.warn('Firestore order status update note:', error);
  }
}

/**
 * Send a waiter call
 */
export async function sendWaiterCall(tableNumber: number, reason: WaiterCall['reason'], notes?: string): Promise<string> {
  const callId = 'CALL-' + Date.now().toString(36).toUpperCase();
  const newCall: WaiterCall = {
    id: callId,
    tableNumber: Number(tableNumber),
    reason,
    status: 'pending',
    notes: notes || '',
    createdAt: Date.now(),
  };

  const locals = getLocalCalls();
  saveLocalCalls([newCall, ...locals]);
  emitLocalUpdate('calls');

  try {
    const callRef = doc(db, 'waiterCalls', callId);
    const cleaned = cleanForFirestore({
      ...newCall,
      serverCreatedAt: serverTimestamp(),
    });
    await setDoc(callRef, cleaned);
  } catch (error) {
    console.warn('Firestore waiter call save note:', error);
  }

  return callId;
}

/**
 * Resolve a waiter call
 */
export async function resolveWaiterCall(callId: string): Promise<void> {
  const now = Date.now();
  const locals = getLocalCalls().map((c) =>
    c.id === callId ? { ...c, status: 'resolved' as const, resolvedAt: now } : c
  );
  saveLocalCalls(locals);
  emitLocalUpdate('calls');

  try {
    const callRef = doc(db, 'waiterCalls', callId);
    await updateDoc(callRef, {
      status: 'resolved',
      resolvedAt: now,
    });
  } catch (error) {
    console.warn('Firestore waiter call resolve note:', error);
  }
}
