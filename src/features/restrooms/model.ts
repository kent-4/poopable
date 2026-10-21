import type {
  CatalogSnapshot,
  Filters,
  Restroom,
  Review,
  Search,
  UsabilityReport,
} from './types';
export const emptyFilters: Filters = {
  bidet: false,
  wheelchair: false,
  babyChanging: false,
  free: false,
  gender: 'any',
  minimumScore: null,
  includeDesperate: false,
};
export function currentReviews(
  reviews: Review[],
  restroomId: string,
): Review[] {
  const current = new Map<string, Review>();
  for (const review of reviews.filter((r) => r.restroomId === restroomId)) {
    const previous = current.get(review.authorId);
    if (
      !previous ||
      review.updatedAt > previous.updatedAt ||
      (review.updatedAt === previous.updatedAt && review.id > previous.id)
    )
      current.set(review.authorId, review);
  }
  return [...current.values()]
    .filter((r) => !r.suppressed)
    .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
}
export function assessment(
  snapshot: CatalogSnapshot,
  restroom: Restroom,
  now: number,
) {
  const reviews = currentReviews(snapshot.reviews, restroom.id);
  const summary = snapshot.reviewSummaries?.[restroom.id];
  const values = (
    key: 'overall' | 'cleanliness' | 'supplies' | 'facilityCondition',
  ) =>
    reviews
      .map((r) => r[key])
      .filter(
        (value): value is number =>
          typeof value === 'number' && value >= 1 && value <= 5,
      );
  const average = (
    key: 'overall' | 'cleanliness' | 'supplies' | 'facilityCondition',
  ) => {
    if (summary) return summary[key];
    const scores = values(key);
    return {
      value: scores.length
        ? scores.reduce((sum, n) => sum + n, 0) / scores.length
        : null,
      count: scores.length,
    };
  };
  const answers = reviews.filter(
    (r) =>
      typeof r.desperateTimes === 'boolean' &&
      r.updatedAt <= now &&
      now - r.updatedAt < 30 * 86400000,
  );
  const flagged =
    summary?.desperate.flagged ??
    answers.filter((r) => r.desperateTimes).length;
  const total = summary?.desperate.total ?? answers.length;
  const pending =
    !!summary &&
    (summary.asOf > now ||
      (summary.desperate.expiresAt !== null &&
        now >= summary.desperate.expiresAt));
  const reports = snapshot.reports
    .filter(
      (r) =>
        r.restroomId === restroom.id && !r.suppressed && r.observedAt <= now,
    )
    .sort((a, b) => b.observedAt - a.observedAt || b.id.localeCompare(a.id));
  const latest = reports[0];
  const recent =
    latest && now - latest.observedAt < 2 * 3600000 ? latest : null;
  const opening = openingState(restroom, now);
  const eligible =
    restroom.state === 'published' &&
    !pending &&
    opening !== 'closed' &&
    (!recent || recent.state === 'usable');
  return {
    opening,
    eligible,
    reviews,
    reports,
    recent,
    overall: average('overall'),
    cleanliness: average('cleanliness'),
    supplies: average('supplies'),
    facilityCondition: average('facilityCondition'),
    desperate: {
      flagged,
      total,
      classified: !pending && total >= 3 && flagged > total / 2,
      latestAt: summary
        ? summary.desperate.latestAt
        : (answers[0]?.updatedAt ?? null),
      pending,
    },
  };
}
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function discover(
  snapshot: CatalogSnapshot,
  search: Search,
  now: number,
) {
  if (!search.center) return [];
  const query = search.query.trim().toLocaleLowerCase();
  return snapshot.restrooms
    .filter((r) => r.state === 'published')
    .map((restroom) => ({
      restroom,
      distance: distanceKm(search.center!, restroom.entrance),
      assessment: assessment(snapshot, restroom, now),
    }))
    .filter((row) => {
      const { restroom: r, distance, assessment: a } = row;
      const f = search.filters;
      return (
        distance <= search.radiusKm &&
        (!query ||
          `${r.name} ${r.building} ${r.address}`
            .toLocaleLowerCase()
            .includes(query)) &&
        (!f.wheelchair || r.attributes.wheelchair === 'yes') &&
        (!f.bidet || r.attributes.bidet === 'yes') &&
        (!f.babyChanging || r.attributes.babyChanging === 'yes') &&
        (!f.free || r.access.fee === 'free') &&
        (f.gender === 'any' || r.attributes.gender === f.gender) &&
        (f.minimumScore === null ||
          (a.overall.value !== null && a.overall.value >= f.minimumScore)) &&
        (f.includeDesperate ||
          (!a.desperate.pending && !a.desperate.classified))
      );
    })
    .sort(
      (a, b) =>
        Number(b.assessment.eligible) - Number(a.assessment.eligible) ||
        (a.assessment.eligible
          ? Number(a.assessment.desperate.classified) -
            Number(b.assessment.desperate.classified)
          : 0) ||
        Number(b.assessment.opening === 'open') -
          Number(a.assessment.opening === 'open') ||
        a.distance - b.distance ||
        Number(b.assessment.recent?.state === 'usable') -
          Number(a.assessment.recent?.state === 'usable') ||
        (b.assessment.overall.value ?? -1) -
          (a.assessment.overall.value ?? -1) ||
        a.restroom.id.localeCompare(b.restroom.id),
    );
}
export type DiscoveryResult = ReturnType<typeof discover>[number];
export function usabilityText(recent: UsabilityReport | null) {
  return recent
    ? `Reported ${recent.state.replaceAll('-', ' ')} · ${new Date(recent.observedAt).toLocaleString()}`
    : 'Current usability unknown';
}

export function openingState(
  restroom: Restroom,
  now: number,
): 'open' | 'closed' | 'unknown' {
  if (!restroom.hours) return 'unknown';
  const minutes = (value: string, end = false): number | null => {
    if (end && value === '24:00') return 1440;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const [hours, minute] = value.split(':').map(Number);
    return hours * 60 + minute;
  };
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: restroom.timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const value = (type: string) => parts.find((p) => p.type === type)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
      value('weekday') ?? '',
    );
    const minute = Number(value('hour')) * 60 + Number(value('minute'));
    if (day < 0 || !Number.isFinite(minute)) return 'unknown';
    let open = false;
    for (const period of restroom.hours) {
      const start = minutes(period.opens);
      const end = minutes(period.closes, true);
      if (
        !Number.isInteger(period.day) ||
        period.day < 0 ||
        period.day > 6 ||
        start === null ||
        end === null ||
        start === end
      )
        return 'unknown';
      if (end > start)
        open ||= period.day === day && minute >= start && minute < end;
      else
        open ||=
          (period.day === day && minute >= start) ||
          ((period.day + 1) % 7 === day && minute < end);
    }
    return open ? 'open' : 'closed';
  } catch {
    return 'unknown';
  }
}
export function openingText(opening: 'open' | 'closed' | 'unknown') {
  return opening === 'open'
    ? 'Expected open'
    : opening === 'closed'
      ? 'Expected closed'
      : 'Opening hours unknown';
}
