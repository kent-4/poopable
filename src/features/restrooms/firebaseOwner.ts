import {
  type Firestore,
  collection,
  doc,
  documentId,
  orderBy,
  startAfter,
  getDocsFromServer,
  limit,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Restroom } from './types';

/** Operational API, deliberately outside consumer screens. Rules require a trusted owner claim. */
export function createOwnerOperations(db: Firestore) {
  return {
    importRestroom: async (restroom: Restroom) => {
      if (
        !restroom.id ||
        restroom.id.includes('/') ||
        !restroom.name.trim() ||
        !Number.isFinite(restroom.entrance.latitude) ||
        Math.abs(restroom.entrance.latitude) > 90 ||
        !Number.isFinite(restroom.entrance.longitude) ||
        Math.abs(restroom.entrance.longitude) > 180
      )
        throw new Error('Provide a valid restroom identity and entrance.');
      await setDoc(doc(db, 'restrooms', restroom.id), restroom);
    },
    inspectFlags: async (after?: string) => {
      const page = await getDocsFromServer(
        query(
          collection(db, 'moderationFlags'),
          orderBy(documentId()),
          ...(after ? [startAfter(after)] : []),
          limit(100),
        ),
      );
      return {
        items: page.docs.map((item) => ({ id: item.id, ...item.data() })),
        nextCursor: page.size === 100 ? page.docs[99].id : undefined,
      };
    },
    suppress: async (
      kind: 'review' | 'report',
      id: string,
      suppressed = true,
    ) => {
      await updateDoc(doc(db, kind === 'review' ? 'reviews' : 'reports', id), {
        suppressed,
      });
    },
  };
}
