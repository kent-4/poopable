import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { emptyFilters } from './model';
import type {
  CatalogSnapshot,
  ExperienceDependencies,
  Search,
  Visitor,
} from './types';
const empty: CatalogSnapshot = { restrooms: [], reviews: [], reports: [] };
function useExperience(dependencies: ExperienceDependencies) {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>(empty);
  const [search, setSearch] = useState<Search>({
    center: dependencies.initialCenter ?? null,
    radiusKm: 1,
    query: '',
    filters: { ...emptyFilters },
  });
  const [visitor, setVisitor] = useState<Visitor | null>(() =>
    dependencies.auth.current(),
  );
  const [now, setNow] = useState(() => dependencies.clock.now());
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [snapshotVisitorId, setSnapshotVisitorId] = useState<string | null>(
    null,
  );
  const request = useRef(0);
  const visitorId = useRef(visitor?.id ?? null);
  const attemptedSummaryRefresh = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    setRefreshing(true);
    setError(null);
    const authorId = dependencies.auth.current()?.id ?? null;
    try {
      const data = await dependencies.repository.load(dependencies.clock.now());
      if (version === request.current) {
        setSnapshot(data);
        setNow(dependencies.clock.now());
        setLastRefreshed(dependencies.clock.now());
        setRevision((value) => value + 1);
        setSnapshotVisitorId(authorId);
      }
    } catch (error) {
      if (version === request.current)
        setError(
          error instanceof Error ? error.message : 'Could not load restrooms.',
        );
    } finally {
      if (version === request.current) setRefreshing(false);
    }
  }, [dependencies]);
  const cancelRequests = useCallback(() => {
    request.current++;
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      cancelRequests();
    };
  }, [refresh, cancelRequests]);
  useEffect(
    () =>
      dependencies.auth.subscribe((next) => {
        setVisitor(next);
        const nextId = next?.id ?? null;
        if (nextId !== visitorId.current) {
          visitorId.current = nextId;
          void refresh();
        }
      }),
    [dependencies, refresh],
  );
  useEffect(() => {
    const expired = Object.entries(snapshot.reviewSummaries ?? {}).filter(
      ([, summary]) =>
        summary.asOf > now ||
        (summary.desperate.expiresAt !== null &&
          summary.desperate.expiresAt <= now),
    );
    if (!expired.length) {
      attemptedSummaryRefresh.current = null;
      return;
    }
    const key = expired
      .map(
        ([id, summary]) =>
          `${id}:${summary.asOf}:${summary.desperate.expiresAt}`,
      )
      .join('|');
    if (attemptedSummaryRefresh.current === key) return;
    attemptedSummaryRefresh.current = key;
    void refresh();
  }, [snapshot.reviewSummaries, now, refresh]);
  useEffect(() => {
    const tick = () => setNow(dependencies.clock.now());
    const unsubscribe = dependencies.clock.subscribe?.(tick);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        void refresh();
      }
    });
    return () => {
      unsubscribe?.();
      subscription.remove();
    };
  }, [dependencies, refresh]);
  useEffect(() => {
    const future = [
      ...snapshot.reviews.map((review) => review.updatedAt + 30 * 86400000),
      ...snapshot.reports.map((report) => report.observedAt + 2 * 3600000),
      ...Object.values(snapshot.reviewSummaries ?? {}).map(
        (summary) => summary.desperate.expiresAt ?? Infinity,
      ),
      Math.floor(now / 60000) * 60000 + 60000,
    ].filter((time) => time > now);
    const next = Math.min(...future);
    const timer = setTimeout(
      () => setNow(dependencies.clock.now()),
      Math.max(1, next - dependencies.clock.now()),
    );
    return () => clearTimeout(timer);
  }, [snapshot, now, dependencies]);
  return {
    snapshot,
    search,
    setSearch,
    visitor,
    dependencies,
    now,
    refreshing,
    error,
    lastRefreshed,
    revision,
    snapshotVisitorId,
    refresh,
  };
}
type Experience = ReturnType<typeof useExperience>;
const Context = createContext<Experience | null>(null);
export function RestroomExperienceProvider({
  dependencies,
  children,
}: {
  dependencies: ExperienceDependencies;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={useExperience(dependencies)}>
      {children}
    </Context.Provider>
  );
}
export function useRestroomExperience() {
  const value = useContext(Context);
  if (!value) throw new Error('RestroomExperienceProvider is required.');
  return value;
}
