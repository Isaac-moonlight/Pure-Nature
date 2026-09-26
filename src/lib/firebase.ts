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
  getDocs
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

// Local fallback keys & broadcast channel for multi-tab zero-latency sync
const LOCAL_ORDERS_KEY = 'pn_orders_storage_v2';
const LOCAL_CALLS_KEY = 'pn_calls_storage_v2';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pure_nature_channel')
  : null;

function getLocalOrders(): Order[] {
  try {
    const data = localStorage.getItem(LOCAL_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // quota safe
  }
}

function getLocalCalls(): WaiterCall[] {
  try {
    const data = localStorage.getItem(LOCAL_CALLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalCalls(calls: WaiterCall[]) {
  try {
    localStorage.setItem(LOCAL_CALLS_KEY, JSON.stringify(calls));
  } catch {
    // quota safe
  }
}

// Dispatches internal event for instant reactivity in same tab
function emitLocalUpdate(type: 'orders' | 'calls') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`pure_nature_${type}_updated`));
    broadcastChannel?.postMessage({ type });
  }
}

/**
 * Real-time listener for all kitchen orders (combines Firestore with zero-latency local/multi-tab sync)
 */
export function subscribeToAllOrders(
  onUpdate: (orders: Order[]) => void
): Unsubscribe {
  let isFirestoreActive = false;

  // Immediate emission from cache so UI never waits
  const initial = getLocalOrders();
  if (initial.length > 0) {
    onUpdate(initial);
  }

  // Cross-tab and in-memory listener
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

  // Firestore onSnapshot (query without mandatory composite index to prevent indexing issues)
  let unsubscribeFirestore: Unsubscribe = () => {};

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, limit(150));

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        isFirestoreActive = true;
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

        // Merge with local orders in case any are pending sync
        const localOrders = getLocalOrders();
        const mergedMap = new Map<string, Order>();
        
        localOrders.forEach((o) => mergedMap.set(o.id, o));
        firestoreOrders.forEach((o) => mergedMap.set(o.id, o)); // firestore authoritative

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

        saveLocalOrders(mergedList);
        onUpdate(mergedList);
      },
      (err: FirestoreError) => {
        console.warn('Firestore orders sync note (using local high-speed cache):', err.message);
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
  // Immediate cache update
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
    const q = query(callsCol, limit(50));

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
  };

  // Instant local save & broadcast (0ms UI latency)
  const existing = getLocalOrders();
  saveLocalOrders([newOrder, ...existing]);
  emitLocalUpdate('orders');

  // Async Firestore persistence
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await setDoc(orderDocRef, {
      ...newOrder,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Firestore background write notification:', error);
  }

  return orderId;
}

/**
 * Update order status (kitchen workflow)
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
  // Update local cache immediately
  const locals = getLocalOrders().map((o) =>
    o.id === orderId ? { ...o, status: newStatus, updatedAt: Date.now() } : o
  );
  saveLocalOrders(locals);
  emitLocalUpdate('orders');

  // Firestore update
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      updatedAt: Date.now(),
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
    await setDoc(callRef, {
      ...newCall,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Firestore waiter call save note:', error);
  }

  return callId;
}

/**
 * Resolve a waiter call
 */
export async function resolveWaiterCall(callId: string): Promise<void> {
  const locals = getLocalCalls().map((c) =>
    c.id === callId ? { ...c, status: 'resolved' as const, resolvedAt: Date.now() } : c
  );
  saveLocalCalls(locals);
  emitLocalUpdate('calls');

  try {
    const callRef = doc(db, 'waiterCalls', callId);
    await updateDoc(callRef, {
      status: 'resolved',
      resolvedAt: Date.now(),
    });
  } catch (error) {
    console.warn('Firestore waiter call resolve note:', error);
  }
}
