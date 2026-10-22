import { distanceKm } from './model.ts';
import type {
  CatalogScope,
  Coordinates,
  LocationCursor,
  LocationPage,
  Restroom,
} from './types';

export function validateScope(scope: CatalogScope) {
  const point = scope.center;
  if (
    ![1, 2, 5].includes(scope.radiusKm) ||
    (point &&
      (!Number.isFinite(point.latitude) ||
        Math.abs(point.latitude) > 90 ||
        !Number.isFinite(point.longitude) ||
        Math.abs(point.longitude) > 180)) ||
    (scope.detailId !== undefined &&
      (!scope.detailId || scope.detailId.includes('/')))
  )
    throw new Error('Invalid search area or restroom identity.');
}

/** Bounding rectangles contain the direct-distance circle, including poles/date-line crossings. */
export function searchBounds(
  center: Coordinates,
  radiusKm: CatalogScope['radiusKm'],
) {
  validateScope({ center, radiusKm });
  const radians = Math.PI / 180;
  const angular = radiusKm / 6371;
  const delta = angular / radians;
  const south = Math.max(-90, center.latitude - delta);
  const north = Math.min(90, center.latitude + delta);
  if (south <= -90 || north >= 90)
    return [{ south, north, west: -180, east: 180 }];
  const longitudeDelta =
    Math.asin(
      Math.min(1, Math.sin(angular) / Math.cos(center.latitude * radians)),
    ) / radians;
  const west = center.longitude - longitudeDelta;
  const east = center.longitude + longitudeDelta;
  if (west <= -180)
    return [
      { south, north, west: west + 360, east: 180 },
      { south, north, west: -180, east },
    ];
  if (east >= 180)
    return [
      { south, north, west, east: 180 },
      { south, north, west: -180, east: east - 360 },
    ];
  return [{ south, north, west, east }];
}

export function inSearchArea(restroom: Restroom, scope: CatalogScope) {
  return (
    restroom.state === 'published' &&
    !!scope.center &&
    distanceKm(scope.center, restroom.entrance) <= scope.radiusKm
  );
}

export function normalizedLocationQuery(value: string) {
  return value.trim().toLocaleLowerCase();
}
export function matchesLocation(restroom: Restroom, query: string) {
  return (
    restroom.state === 'published' &&
    `${restroom.name} ${restroom.building} ${restroom.address}`
      .toLocaleLowerCase()
      .includes(normalizedLocationQuery(query))
  );
}
export function validateLocationCursor(query: string, cursor?: LocationCursor) {
  if (
    cursor &&
    (cursor.query !== normalizedLocationQuery(query) ||
      !cursor.id ||
      cursor.id.includes('/'))
  )
    throw new Error('Invalid location cursor. Search again.');
}
export function memoryLocations(
  restrooms: Restroom[],
  query: string,
  cursor?: LocationCursor,
): LocationPage {
  validateLocationCursor(query, cursor);
  const matches = restrooms
    .filter(
      (restroom) =>
        matchesLocation(restroom, query) &&
        (!cursor || restroom.id > cursor.id),
    )
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const items = matches.slice(0, 10);
  return {
    items,
    next:
      matches.length > 10
        ? { query: normalizedLocationQuery(query), id: items[9].id }
        : null,
  };
}
