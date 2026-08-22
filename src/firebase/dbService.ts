import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './config';
import { Ticket, ITAsset, UserAccount, KBArticle, TicketComment } from '../types';
import { INITIAL_TICKETS, INITIAL_ASSETS, INITIAL_USERS, INITIAL_KB_ARTICLES } from '../data/mockData';
import {
  loadTickets as loadLocalTickets,
  saveTickets as saveLocalTickets,
  loadAssets as loadLocalAssets,
  saveAssets as saveLocalAssets,
  loadUsers as loadLocalUsers,
  saveUsers as saveLocalUsers,
  loadKBArticles as loadLocalKBArticles,
  saveKBArticles as saveLocalKBArticles,
} from '../utils/storage';

const TICKETS_COLLECTION = 'tickets';
const ASSETS_COLLECTION = 'assets';
const USERS_COLLECTION = 'users';
const KB_COLLECTION = 'kbArticles';

// ==========================================
// SEEDING HELPERS (Initial Firestore Bootstrap)
// ==========================================

export async function seedInitialFirestoreDataIfEmpty(): Promise<void> {
  try {
    await ensureFirebaseAuth();

    // 1. Check Tickets
    const ticketSnap = await getDocs(collection(db, TICKETS_COLLECTION));
    if (ticketSnap.empty) {
      console.log('Seeding initial tickets to Firestore...');
      const batch = writeBatch(db);
      INITIAL_TICKETS.forEach((t) => {
        const docRef = doc(db, TICKETS_COLLECTION, t.id);
        batch.set(docRef, t);
      });
      await batch.commit();
    }

    // 2. Check Assets
    const assetSnap = await getDocs(collection(db, ASSETS_COLLECTION));
    if (assetSnap.empty) {
      console.log('Seeding initial IT device inventory to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ASSETS.forEach((a) => {
        const docRef = doc(db, ASSETS_COLLECTION, a.id);
        batch.set(docRef, a);
      });
      await batch.commit();
    }

    // 3. Check Users
    const userSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (userSnap.empty) {
      console.log('Seeding initial user accounts to Firestore...');
      const batch = writeBatch(db);
      INITIAL_USERS.forEach((u) => {
        const docRef = doc(db, USERS_COLLECTION, u.id);
        batch.set(docRef, u);
      });
      await batch.commit();
    }

    // 4. Check KB Articles
    const kbSnap = await getDocs(collection(db, KB_COLLECTION));
    if (kbSnap.empty) {
      console.log('Seeding initial KB articles to Firestore...');
      const batch = writeBatch(db);
      INITIAL_KB_ARTICLES.forEach((kb) => {
        const docRef = doc(db, KB_COLLECTION, kb.id);
        batch.set(docRef, kb);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore seeding check skipped or offline:', err);
  }
}

// ==========================================
// TICKETS REALTIME SYNC & OPERATIONS
// ==========================================

export function subscribeTickets(
  onData: (tickets: Ticket[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, TICKETS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const tickets: Ticket[] = [];
          snapshot.forEach((docSnap) => {
            tickets.push(docSnap.data() as Ticket);
          });
          // Sort by creation date desc
          tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          saveLocalTickets(tickets);
          onData(tickets);
        } else {
          // If Firestore is empty, seed and fallback to local
          const local = loadLocalTickets();
          onData(local);
          seedInitialFirestoreDataIfEmpty();
        }
      },
      (err) => {
        console.warn('Firestore ticket listener error, falling back to local storage:', err);
        if (onError) onError(err);
        onData(loadLocalTickets());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to tickets:', e);
    onData(loadLocalTickets());
    return () => {};
  }
}

export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticket.id);
    await setDoc(docRef, ticket, { merge: true });
  } catch (err) {
    console.error('Error saving ticket to Firestore:', err);
  }
}

export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting ticket from Firestore:', err);
  }
}

export async function addCommentToTicketInFirestore(
  ticketId: string,
  comment: TicketComment,
  existingComments: TicketComment[]
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    const updatedComments = [...existingComments, comment];
    await updateDoc(docRef, {
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error adding comment to Firestore:', err);
  }
}

// ==========================================
// ASSET DIRECTORY (13 FIELDS) REALTIME SYNC
// ==========================================

export function subscribeAssets(
  onData: (assets: ITAsset[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const assets: ITAsset[] = [];
          snapshot.forEach((docSnap) => {
            assets.push(docSnap.data() as ITAsset);
          });
          // Sort by employeeName
          assets.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
          saveLocalAssets(assets);
          onData(assets);
        } else {
          const local = loadLocalAssets();
          onData(local);
          seedInitialFirestoreDataIfEmpty();
        }
      },
      (err) => {
        console.warn('Firestore asset listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalAssets());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to assets:', e);
    onData(loadLocalAssets());
    return () => {};
  }
}

export async function saveAssetToFirestore(asset: ITAsset): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, ASSETS_COLLECTION, asset.id);
    await setDoc(docRef, asset, { merge: true });
  } catch (err) {
    console.error('Error saving asset to Firestore:', err);
  }
}

export async function deleteAssetFromFirestore(assetId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting asset from Firestore:', err);
  }
}

// ==========================================
// USER ACCOUNTS REALTIME SYNC
// ==========================================

export function subscribeUsers(
  onData: (users: UserAccount[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const users: UserAccount[] = [];
          snapshot.forEach((docSnap) => {
            users.push(docSnap.data() as UserAccount);
          });
          users.sort((a, b) => a.name.localeCompare(b.name));
          saveLocalUsers(users);
          onData(users);
        } else {
          const local = loadLocalUsers();
          onData(local);
          seedInitialFirestoreDataIfEmpty();
        }
      },
      (err) => {
        console.warn('Firestore users listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalUsers());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to users:', e);
    onData(loadLocalUsers());
    return () => {};
  }
}

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
}

// ==========================================
// KB ARTICLES REALTIME SYNC
// ==========================================

export function subscribeKBArticles(
  onData: (articles: KBArticle[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, KB_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const articles: KBArticle[] = [];
          snapshot.forEach((docSnap) => {
            articles.push(docSnap.data() as KBArticle);
          });
          saveLocalKBArticles(articles);
          onData(articles);
        } else {
          const local = loadLocalKBArticles();
          onData(local);
          seedInitialFirestoreDataIfEmpty();
        }
      },
      (err) => {
        console.warn('Firestore KB listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalKBArticles());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to KB articles:', e);
    onData(loadLocalKBArticles());
    return () => {};
  }
}

export async function saveKBArticleToFirestore(article: KBArticle): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, KB_COLLECTION, article.id);
    await setDoc(docRef, article, { merge: true });
  } catch (err) {
    console.error('Error saving KB article to Firestore:', err);
  }
}
