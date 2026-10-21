import {
  type Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  type Firestore,
  type QueryConstraint,
  type DocumentData,
  collection,
  doc,
  documentId,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  Timestamp,
} from 'firebase/firestore';
import { historyPageSize, validateHistoryCursor } from './history.ts';
import { loadRestroomContributions } from './firebaseSummary.ts';
import type {
  Authentication,
  RestroomRepository,
  Restroom,
  Review,
  UsabilityReport,
  Visitor,
  HistoryCursor,
  HistoryPage,
} from './types';

/** Bounded catalog with service-side aggregates and separate contribution history pages. */
export function createFirebaseServices(
  auth: Auth,
  db: Firestore,
): { auth: Authentication; repository: RestroomRepository } {
  const listeners = new Set<(value: Visitor | null) => void>();
  const visitor = (): Visitor | null =>
    auth.currentUser
      ? {
          id: auth.currentUser.uid,
          displayName: auth.currentUser.displayName ?? 'Visitor',
        }
      : null;
  async function identity() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in to contribute.');
    await user.getIdToken(true);
    if (!user.displayName?.trim())
      throw new Error('Set a public display name before contributing.');
    return { authorId: user.uid, authorName: user.displayName };
  }
  async function readAll(
    name: string,
    filters: QueryConstraint[],
    maximum: number,
  ) {
    const result: DocumentData[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = await getDocsFromServer(
        query(
          collection(db, name),
          ...filters,
          orderBy(documentId()),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(100),
        ),
      );
      for (const item of page.docs)
        result.push({ ...item.data(), id: item.id });
      if (result.length > maximum)
        throw new Error(
          'This catalog exceeds the supported development size. Ask the owner to configure a larger catalog service.',
        );
      if (page.size < 100) return result;
      cursor = page.docs[page.size - 1].id;
    }
  }
  const timestamp = (value: unknown) => {
    if (
      !value ||
      typeof (value as { toMillis?: unknown }).toMillis !== 'function'
    )
      throw new Error('Catalog contains an invalid contribution timestamp.');
    return (value as { toMillis(): number }).toMillis();
  };
  async function readHistory<T>(
    kind: HistoryCursor['kind'],
    field: 'updatedAt' | 'observedAt',
    restroomId: string,
    cursor?: HistoryCursor,
  ): Promise<HistoryPage<T>> {
    validateHistoryCursor(restroomId, kind, cursor);
    const page = await getDocsFromServer(
      query(
        collection(db, kind),
        where('restroomId', '==', restroomId),
        where('suppressed', '==', false),
        orderBy(field, 'desc'),
        orderBy(documentId(), 'desc'),
        ...(cursor
          ? [
              startAfter(
                new Timestamp(cursor.seconds, cursor.nanoseconds),
                cursor.id,
              ),
            ]
          : []),
        limit(historyPageSize + 1),
      ),
    );
    const documents = page.docs.slice(0, historyPageSize);
    const last = documents.at(-1);
    const lastTime = last?.data()[field] as Timestamp | undefined;
    return {
      items: documents.map(
        (item) =>
          ({
            ...item.data(),
            id: item.id,
            [field]: timestamp(item.data()[field]),
          }) as T,
      ),
      next:
        page.size > historyPageSize && last && lastTime
          ? {
              restroomId,
              kind,
              id: last.id,
              seconds: lastTime.seconds,
              nanoseconds: lastTime.nanoseconds,
            }
          : null,
    };
  }
  return {
    auth: {
      current: visitor,
      subscribe: (listener) => {
        listeners.add(listener);
        const unsubscribe = onAuthStateChanged(auth, () => listener(visitor()));
        return () => {
          listeners.delete(listener);
          unsubscribe();
        };
      },
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      register: async (email, password, displayName) => {
        const name = displayName.trim();
        if (!name || name.length > 80 || name.includes('@'))
          throw new Error(
            'Choose a public name of at most 80 characters without an email address.',
          );
        const account = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        await updateProfile(account.user, { displayName: name });
        await account.user.getIdToken(true);
        listeners.forEach((listener) => listener(visitor()));
      },
      recover: (email) => sendPasswordResetEmail(auth, email.trim()),
      signOut: () => signOut(auth),
    },
    repository: {
      loadReviews: (restroomId, cursor) =>
        readHistory<Review>('reviews', 'updatedAt', restroomId, cursor),
      loadReports: (restroomId, cursor) =>
        readHistory<UsabilityReport>(
          'reports',
          'observedAt',
          restroomId,
          cursor,
        ),
      load: async (now = Date.now()) => {
        const restrooms = await readAll(
          'restrooms',
          [where('state', 'in', ['published', 'permanently-closed'])],
          200,
        );
        const authorId = auth.currentUser?.uid;
        const contributions: Awaited<
          ReturnType<typeof loadRestroomContributions>
        >[] = [];
        // Limit facility concurrency; each facility uses only bounded document reads and index aggregates.
        for (let offset = 0; offset < restrooms.length; offset += 4) {
          contributions.push(
            ...(await Promise.all(
              restrooms
                .slice(offset, offset + 4)
                .map((restroom) =>
                  loadRestroomContributions(db, restroom.id, now, authorId),
                ),
            )),
          );
        }
        return {
          restrooms: restrooms as Restroom[],
          reviews: contributions.flatMap((value) => value.reviews),
          reports: contributions.flatMap((value) => value.reports),
          reviewSummaries: Object.fromEntries(
            restrooms.map((restroom, index) => [
              restroom.id,
              contributions[index].summary,
            ]),
          ),
        };
      },
      saveReview: async (restroomId, input) => {
        const author = await identity();
        const values = Object.fromEntries(
          Object.entries(input).filter(([, value]) => value !== undefined),
        );
        await runTransaction(db, async (transaction) => {
          await transaction.get(doc(db, 'restrooms', restroomId));
          transaction.set(
            doc(db, 'reviews', `${restroomId}:${author.authorId}`),
            {
              ...values,
              ...author,
              restroomId,
              updatedAt: serverTimestamp(),
              suppressed: false,
            },
          );
        });
      },
      submitReport: async (restroomId, state, submissionId) => {
        const author = await identity();
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(submissionId))
          throw new Error('Invalid submission identifier.');
        const ref = doc(db, 'reports', `${author.authorId}:${submissionId}`);
        await runTransaction(db, async (transaction) => {
          const existing = await transaction.get(ref);
          if (existing.exists()) {
            if (
              existing.data().authorId !== author.authorId ||
              existing.data().restroomId !== restroomId ||
              existing.data().state !== state
            )
              throw new Error('This submission identifier was already used.');
            return;
          }
          transaction.set(ref, {
            ...author,
            restroomId,
            state,
            observedAt: serverTimestamp(),
            suppressed: false,
          });
        });
      },
      flagContribution: async (kind, contributionId, reason) => {
        const author = await identity();
        await runTransaction(db, async (transaction) => {
          await transaction.get(
            doc(db, kind === 'review' ? 'reviews' : 'reports', contributionId),
          );
          transaction.set(
            doc(
              db,
              'moderationFlags',
              `${author.authorId}:${kind}:${contributionId}`,
            ),
            {
              authorId: author.authorId,
              kind,
              contributionId,
              reason: reason.trim(),
              createdAt: serverTimestamp(),
            },
          );
        });
      },
    },
  };
}
