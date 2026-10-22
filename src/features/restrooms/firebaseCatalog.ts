import {
  type Firestore,
  collection,
  documentId,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import {
  inSearchArea,
  matchesLocation,
  normalizedLocationQuery,
  searchBounds,
  validateLocationCursor,
  validateScope,
} from './search-area.ts';
import type {
  CatalogScope,
  LocationCursor,
  LocationPage,
  Restroom,
} from './types';

export async function loadScopedCatalog(
  db: Firestore,
  scope: CatalogScope,
): Promise<Restroom[]> {
  validateScope(scope);
  const catalog = collection(db, 'restrooms');
  const nearby =
    scope.center && !scope.detailId
      ? searchBounds(scope.center, scope.radiusKm).map(async (box) => {
          const page = await getDocsFromServer(
            query(
              catalog,
              where('state', '==', 'published'),
              where('entrance.latitude', '>=', box.south),
              where('entrance.latitude', '<=', box.north),
              where('entrance.longitude', '>=', box.west),
              where('entrance.longitude', '<=', box.east),
              orderBy('entrance.latitude'),
              orderBy('entrance.longitude'),
              orderBy(documentId()),
              limit(201),
            ),
          );
          if (page.size > 200)
            throw new Error(
              'This search area has too many listings. Choose another area or a smaller radius.',
            );
          return page.docs
            .map((item) => ({ ...item.data(), id: item.id }) as Restroom)
            .filter((restroom) => inSearchArea(restroom, scope));
        })
      : [];
  const detail = scope.detailId
    ? getDocsFromServer(
        query(
          catalog,
          where(documentId(), '==', scope.detailId),
          where('state', 'in', ['published', 'permanently-closed']),
          limit(1),
        ),
      ).then((page) =>
        page.docs.map((item) => ({ ...item.data(), id: item.id }) as Restroom),
      )
    : Promise.resolve([]);
  const groups = await Promise.all([...nearby, detail]);
  const nearbyCount = new Set(
    groups
      .slice(0, nearby.length)
      .flat()
      .map((restroom) => restroom.id),
  ).size;
  const matches = [
    ...new Map(
      groups.flat().map((restroom) => [restroom.id, restroom]),
    ).values(),
  ];
  if (nearbyCount > 200)
    throw new Error(
      'This search area has too many listings. Choose another area or a smaller radius.',
    );
  return matches;
}

/** Explicit name/address lookup only. Bounded metadata scan; never loads review aggregates. */
export async function findCatalogLocations(
  db: Firestore,
  search: string,
  cursor?: LocationCursor,
): Promise<LocationPage> {
  validateLocationCursor(search, cursor);
  const term = normalizedLocationQuery(search);
  const items: Restroom[] = [];
  let after = cursor?.id;
  for (let batch = 0; batch < 3; batch++) {
    const page = await getDocsFromServer(
      query(
        collection(db, 'restrooms'),
        where('state', '==', 'published'),
        orderBy(documentId()),
        ...(after ? [startAfter(after)] : []),
        limit(100),
      ),
    );
    for (const item of page.docs) {
      after = item.id;
      const restroom = { ...item.data(), id: item.id } as Restroom;
      if (matchesLocation(restroom, term)) items.push(restroom);
      if (items.length === 10)
        return { items, next: { query: term, id: after } };
    }
    if (page.size < 100) return { items, next: null };
  }
  return { items, next: after ? { query: term, id: after } : null };
}
