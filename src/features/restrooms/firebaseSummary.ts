import {
  type Firestore,
  type Timestamp,
  average,
  collection,
  count,
  documentId,
  getAggregateFromServer,
  getCountFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  Timestamp as FirestoreTimestamp,
  where,
} from 'firebase/firestore';
import type { Review, ReviewSummary, UsabilityReport } from './types';

/** Read-time aggregates scan server indexes without downloading contribution bodies. */
export async function loadRestroomContributions(
  db: Firestore,
  restroomId: string,
  now: number,
  authorId?: string,
) {
  const reviews = collection(db, 'reviews');
  const publicFacility = [
    where('restroomId', '==', restroomId),
    where('suppressed', '==', false),
  ];
  const score = async (
    field: 'overall' | 'cleanliness' | 'supplies' | 'facilityCondition',
  ) => {
    // Separate queries preserve each optional dimension's own denominator.
    return (
      await getAggregateFromServer(
        query(
          reviews,
          ...publicFacility,
          where(field, '>=', 1),
          where(field, '<=', 5),
        ),
        {
          value: average(field),
          count: count(),
        },
      )
    ).data();
  };
  const recentAnswers = [
    ...publicFacility,
    where('updatedAt', '>', FirestoreTimestamp.fromMillis(now - 30 * 86400000)),
    where('updatedAt', '<=', FirestoreTimestamp.fromMillis(now)),
  ];
  const answerCount = async (answer: boolean) =>
    (
      await getCountFromServer(
        query(reviews, ...recentAnswers, where('desperateTimes', '==', answer)),
      )
    ).data().count;
  const answerEdge = async (direction: 'asc' | 'desc') => {
    const edge = await getDocsFromServer(
      query(
        reviews,
        ...recentAnswers,
        where('desperateTimes', 'in', [true, false]),
        orderBy('updatedAt', direction),
        limit(1),
      ),
    );
    return (
      (edge.docs[0]?.data().updatedAt as Timestamp | undefined)?.toMillis() ??
      null
    );
  };
  const [
    overall,
    cleanliness,
    supplies,
    facilityCondition,
    flagged,
    negative,
    earliest,
    latestAt,
    latestReport,
    ownReview,
  ] = await Promise.all([
    score('overall'),
    score('cleanliness'),
    score('supplies'),
    score('facilityCondition'),
    answerCount(true),
    answerCount(false),
    answerEdge('asc'),
    answerEdge('desc'),
    getDocsFromServer(
      query(
        collection(db, 'reports'),
        ...publicFacility,
        where('observedAt', '<=', FirestoreTimestamp.fromMillis(now)),
        orderBy('observedAt', 'desc'),
        orderBy(documentId(), 'desc'),
        limit(1),
      ),
    ),
    authorId
      ? getDocsFromServer(
          query(
            reviews,
            ...publicFacility,
            where('authorId', '==', authorId),
            limit(1),
          ),
        )
      : undefined,
  ]);
  const summary: ReviewSummary = {
    overall,
    cleanliness,
    supplies,
    facilityCondition,
    asOf: now,
    desperate: {
      flagged,
      total: flagged + negative,
      latestAt,
      expiresAt: earliest === null ? null : earliest + 30 * 86400000,
    },
  };
  return {
    summary,
    reviews: (ownReview?.docs ?? []).map(
      (item) =>
        ({
          ...item.data(),
          id: item.id,
          updatedAt: (item.data().updatedAt as Timestamp).toMillis(),
        }) as Review,
    ),
    reports: latestReport.docs.map(
      (item) =>
        ({
          ...item.data(),
          id: item.id,
          observedAt: (item.data().observedAt as Timestamp).toMillis(),
        }) as UsabilityReport,
    ),
  };
}
